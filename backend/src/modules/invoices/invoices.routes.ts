import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { EbarimtService } from '../../services/ebarimt.service';

export const invoicesRouter = Router();
invoicesRouter.use(authenticate);

// POST /api/invoices/generate/:packageId - Auto-generate invoice when package arrives at UB
invoicesRouter.post('/generate/:packageId', authorize('STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: req.params.packageId as string },
      include: {
        order: { include: { insurance: true } },
        customs: true,
        company: true,
        batch: {
          include: { sourceBid: true }
        }
      },
    });
    if (!pkg) throw new AppError('Бараа олдсонгүй', 404);
    if (!pkg.order) throw new AppError('Захиалга холбогдоогүй', 400);
    if (!pkg.customerId) throw new AppError('Харилцагч тодорхойгүй', 400);

    // Check if invoice already exists
    const existing = await prisma.invoiceItem.findFirst({
      where: { packageId: pkg.id },
    });
    if (existing) throw new AppError('Нэхэмжлэх аль хэдийн үүссэн', 409);

    const settings = await prisma.platformSettings.findFirst();
    const storageFreedays = settings?.storageFreedays || 7;

    // Calculate amounts
    const shippingAmount = Number(pkg.shippingCost || 0);
    const insuranceAmount = pkg.order.insurance ? Number(pkg.order.insurance.premium) : 0;
    const customsAmount = pkg.customs && !pkg.customs.isIncludedInShipping
      ? Number(pkg.customs.totalCustomsFee)
      : 0;

    // Storage fee
    let storageAmount = 0;
    if (pkg.arrivedAt) {
      const daysSinceArrival = Math.floor((Date.now() - pkg.arrivedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceArrival > storageFreedays) {
        const extraDays = daysSinceArrival - storageFreedays;
        const phase1Until = settings?.storageFeePhase1 ? 14 : 14;
        if (daysSinceArrival <= phase1Until) {
          storageAmount = extraDays * Number(settings?.storageFeePhase1 || 500);
        } else {
          const phase1Days = Math.max(0, phase1Until - storageFreedays);
          const phase2Days = extraDays - phase1Days;
          storageAmount = phase1Days * Number(settings?.storageFeePhase1 || 500)
            + phase2Days * Number(settings?.storageFeePhase2 || 1000);
        }
      }
    }

    const vatRate = settings?.vatEnabled ? (settings?.vatRate || 0.10) : 0;

    // Shipping VAT
    const shippingVat = shippingAmount * vatRate;
    // Storage VAT
    const storageVat = storageAmount * vatRate;
    // Note: Insurance and Customs are usually VAT-exempt or already taxed

    const vatAmount = shippingVat + storageVat;
    const totalAmount = shippingAmount + insuranceAmount + customsAmount + storageAmount + vatAmount;

    // Generate invoice code
    const count = await prisma.invoice.count({ where: { companyId: pkg.companyId } });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceCode = `INV-${today}-${String(count + 1).padStart(4, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await prisma.invoice.create({
      data: {
        companyId: pkg.companyId,
        customerId: pkg.customerId,
        invoiceCode,
        shippingAmount,
        insuranceAmount,
        customsAmount,
        storageAmount,
        vatAmount,
        totalAmount,
        status: 'SENT',
        dueDate,
        items: {
          create: [
            ...(shippingAmount > 0 ? [{
              package: { connect: { id: pkg.id } },
              description: `Тээврийн зардал (${pkg.weightKg}кг)`,
              unitPrice: shippingAmount,
              vatAmount: shippingAmount * vatRate,
              amount: shippingAmount + (shippingAmount * vatRate),
              itemType: 'shipping',
            }] : []),
            ...(insuranceAmount > 0 ? [{
              package: { connect: { id: pkg.id } },
              description: `Даатгал (${pkg.order.insurance?.planSlug})`,
              unitPrice: insuranceAmount,
              vatAmount: 0,
              amount: insuranceAmount,
              itemType: 'insurance',
            }] : []),
            ...(customsAmount > 0 ? [{
              package: { connect: { id: pkg.id } },
              description: 'Гаалийн татвар',
              unitPrice: customsAmount,
              vatAmount: 0,
              amount: customsAmount,
              itemType: 'customs',
            }] : []),
            ...(storageAmount > 0 ? [{
              package: { connect: { id: pkg.id } },
              description: 'Хадгалалтын хураамж',
              unitPrice: storageAmount,
              vatAmount: storageAmount * vatRate,
              amount: storageAmount + (storageAmount * vatRate),
              itemType: 'storage',
            }] : []),
          ],
        },
      },
      include: { items: true },
    });

    // Calculate platform fee
    const feeRate = Number(settings?.defaultPlatformFeeRate || 0.04);
    const feeAmount = Math.max(
      Math.min(shippingAmount * feeRate, Number(settings?.maxPlatformFee || 50000)),
      Number(settings?.minPlatformFee || 200)
    );
    const platformFeeVat = settings?.vatEnabled ? (feeAmount * vatRate) : 0;
    const qpayFee = totalAmount * Number(settings?.qpayFeeRate || 0.01);

    // Calculate Carrier Split if applicable
    let carrierId = null;
    let carrierAmount = 0;
    if (pkg.batch && pkg.batch.carrierId && pkg.batch.carrierId !== pkg.companyId) {
      carrierId = pkg.batch.carrierId;
      if (pkg.batch.sourceBid) {
        // Linear split by weight: (Total Bid / Total Weight) * Package Weight
        const batchWeight = Number(pkg.batch.totalWeight || 0);
        if (batchWeight > 0) {
          let bidAmount = Number(pkg.batch.sourceBid.amount);

          // Currency conversion if needed (assuming MNT is the base)
          if (pkg.batch.sourceBid.currency === 'CNY') {
            const cnyRate = Number(settings?.cnyRate || 485);
            bidAmount = bidAmount * cnyRate;
          } else if (pkg.batch.sourceBid.currency === 'USD') {
            const usdRate = 3450; // Fallback or add to settings
            bidAmount = bidAmount * usdRate;
          }

          carrierAmount = (bidAmount / batchWeight) * Number(pkg.weightKg || 0);
        }
      }
    }

    const netToCargo = shippingAmount + shippingVat + storageVat - feeAmount - platformFeeVat - qpayFee - carrierAmount;

    await (prisma as any).platformFee.create({
      data: {
        invoiceId: invoice.id,
        companyId: pkg.companyId,
        carrierId,
        shippingAmount,
        feeRate,
        feeAmount,
        vatAmount: platformFeeVat,
        qpayFee,
        carrierAmount,
        netToCargo,
      },
    });

    // Update package status
    await prisma.package.update({
      where: { id: pkg.id },
      data: { status: 'READY_FOR_PICKUP' },
    });

    res.status(201).json({
      success: true,
      message: 'Нэхэмжлэх үүслээ',
      data: { invoice },
    });
  } catch (e) { next(e); }
});

// POST /api/invoices/:id/pay - Mark invoice as paid (QPay callback or manual)
invoicesRouter.post('/:id/pay', async (req, res, next) => {
  try {
    const { paymentMethod, ebarimtType, ebarimtRegNo } = req.body;
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!invoice) throw new AppError('Нэхэмжлэх олдсонгүй', 404);
    if (invoice.status === 'PAID') throw new AppError('Аль хэдийн төлсөн', 400);

    // Generate pickup QR code
    const pickupQr = `ZAMEX-PICKUP-${invoice.invoiceCode}-${Date.now()}`;

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'qpay',
        pickupQrCode: pickupQr,
        ebarimtType: ebarimtType || '1',
        ebarimtRegNo: ebarimtRegNo || null,
      },
    });

    // Generate E-barimt
    const ebarimtResult = await EbarimtService.createBill(updated.id);

    // Add insurance premium to fund
    if (invoice.insuranceAmount > 0) {
      const lastFund = await prisma.insuranceFundTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      const currentBalance = lastFund ? Number(lastFund.balance) : 0;

      await prisma.insuranceFundTransaction.create({
        data: {
          transactionType: 'PREMIUM_IN',
          amount: invoice.insuranceAmount,
          balance: currentBalance + Number(invoice.insuranceAmount),
          referenceId: invoice.id,
          referenceType: 'invoice',
          description: `Даатгалын хураамж: ${invoice.invoiceCode}`,
        },
      });
    }

    res.json({
      success: true,
      message: 'Төлбөр амжилттай',
      data: {
        invoice: updated,
        pickupQrCode: pickupQr,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/invoices/:id/pickup - Verify pickup QR and deliver package
invoicesRouter.post('/:id/pickup', authorize('STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id as string },
      include: { items: { include: { package: true } } },
    });
    if (!invoice) throw new AppError('Нэхэмжлэх олдсонгүй', 404);
    if (invoice.status !== 'PAID') throw new AppError('Төлбөр төлөгдөөгүй', 400);
    if (invoice.pickupQrCode !== qrCode) throw new AppError('QR код буруу', 400);

    // Deliver all packages in invoice
    const packageIds = invoice.items.filter(i => i.packageId).map(i => i.packageId!);
    await prisma.package.updateMany({
      where: { id: { in: packageIds } },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });

    // Update order statuses
    for (const pkgId of packageIds) {
      await prisma.order.updateMany({
        where: { packageId: pkgId },
        data: { status: 'COMPLETED' },
      });
    }

    res.json({
      success: true,
      message: 'Бараа амжилттай олгогдлоо',
      data: { deliveredCount: packageIds.length },
    });
  } catch (e) { next(e); }
});

// GET /api/invoices - List invoices
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: any = {};
    if (role === 'CUSTOMER') where.customerId = userId;
    else if (role !== 'SUPER_ADMIN' && req.user!.companyId) where.companyId = req.user!.companyId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: { select: { description: true, amount: true, itemType: true } },
          company: { select: { name: true, logoUrl: true } },
          customer: { select: { firstName: true, phone: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ success: true, data: { invoices, total, page, limit } });
  } catch (e) { next(e); }
});
