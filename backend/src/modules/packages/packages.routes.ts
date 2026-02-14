import { Router } from 'express';
import { authenticate, authorize, ensureVerifiedCargo, hasPermission, hasAnyPermission } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';
import { sendNotification } from '../notifications/notifications.routes';

export const packagesRouter = Router();
packagesRouter.use(authenticate);

// ═══ Validation ═══

const receivePackageSchema = z.object({
  companyId: z.string().uuid(),
  orderCode: z.string().optional(),
  trackingNumber: z.string().optional(),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  labelPhotoUrl: z.string({ required_error: 'Шошгоны зураг шаардлагатай' }).min(1),
  packagePhotos: z.array(z.string()).min(1, 'Барааны зураг шаардлагатай'),
  shelfLocation: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  condition: z.enum(['INTACT', 'DAMAGED', 'OPENED', 'REPACKAGED', 'WET']).default('INTACT'),
  conditionNote: z.string().optional(),
  pricingRuleId: z.string().uuid().optional(),
  customPriceCny: z.number().nonnegative().optional(),
  destinationId: z.string().uuid().optional(),
  serviceType: z.enum(['STANDARD', 'FAST']).default('STANDARD').optional(),
});

const createBundleSchema = z.object({
  companyId: z.string().uuid(),
  packageIds: z.array(z.string().uuid()).min(2),
  description: z.string().optional(),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  shelfLocation: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  serviceType: z.enum(['STANDARD', 'FAST']).default('STANDARD').optional(),
});

// ═══ Routes ═══

// POST /api/packages/receive - Staff receives package at Erlian warehouse
packagesRouter.post('/receive', ensureVerifiedCargo, hasPermission('CAN_SCAN'), async (req, res, next) => {
  try {
    const data = receivePackageSchema.parse(req.body);

    // Try to match with existing order
    let matchedOrder = null;

    // Match by order code
    if (data.orderCode) {
      matchedOrder = await prisma.order.findUnique({
        where: { orderCode: data.orderCode },
        include: { customer: { select: { id: true, firstName: true, phone: true } } },
      });
    }

    // Match by tracking number
    if (!matchedOrder && data.trackingNumber) {
      matchedOrder = await prisma.order.findFirst({
        where: {
          companyId: data.companyId,
          trackingNumber: data.trackingNumber,
          status: { in: ['PENDING', 'PRE_ANNOUNCED'] },
        },
        include: { customer: { select: { id: true, firstName: true, phone: true } } },
      });
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Calculate CBM
      let cbm = null;
      if (data.lengthCm && data.widthCm && data.heightCm) {
        cbm = (data.lengthCm * data.widthCm * data.heightCm) / 1000000;
      }

      // Calculate shipping cost
      let finalPriceCny = 0;
      let appliedRuleId = data.pricingRuleId || null;
      const settings = await tx.platformSettings.findFirst();
      const exchangeRate = settings?.cnyRate || 485;

      if (data.customPriceCny !== undefined) {
        finalPriceCny = data.customPriceCny;
      } else {
        const pricingRule = await tx.pricingRule.findFirst({
          where: {
            isActive: true,
            ...(data.pricingRuleId ? { id: data.pricingRuleId } : {
              companyId: data.companyId,
              serviceType: data.serviceType || matchedOrder?.serviceType || 'STANDARD',
              ...(data.categoryId ? { categoryId: data.categoryId } : { isDefault: true }),
            }),
          },
        });

        if (pricingRule) {
          appliedRuleId = pricingRule.id;
          if (pricingRule.ruleType === 'FIXED' || pricingRule.ruleType === 'CATEGORY_BASED') {
            finalPriceCny = Number(pricingRule.fixedPrice || 0);
          } else {
            // WEIGHT_VOLUME
            const weightCost = (data.weightKg || 0) * Number(pricingRule.pricePerKg || 0);
            const cbmCost = cbm && pricingRule.pricePerCbm ? cbm * Number(pricingRule.pricePerCbm) : 0;
            finalPriceCny = Math.max(weightCost, cbmCost);
            if (pricingRule.minAmount && finalPriceCny < pricingRule.minAmount) {
              finalPriceCny = pricingRule.minAmount;
            }
          }
        }
      }

      const shippingCost = finalPriceCny * exchangeRate;

      // Create package
      const pkg = await tx.package.create({
        data: {
          companyId: data.companyId,
          customerId: matchedOrder?.customerId,
          trackingNumber: data.trackingNumber || matchedOrder?.trackingNumber,
          weightKg: data.weightKg,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          cbm,
          categoryId: data.categoryId,
          labelPhotoUrl: data.labelPhotoUrl,
          packagePhotos: data.packagePhotos,
          shelfLocation: data.shelfLocation,
          warehouseId: data.warehouseId,
          shippingCost,
          status: (data.weightKg ? 'MEASURED' : 'RECEIVED_ORIGIN') as any,
          serviceType: (data.serviceType as any) || (matchedOrder as any)?.serviceType || 'STANDARD',
          receivedAt: new Date(),
          measuredAt: data.weightKg ? new Date() : null,
          registeredById: req.user!.userId,
          condition: data.condition as any,
          conditionNote: data.conditionNote,
          pricingRuleId: appliedRuleId,
          priceCny: finalPriceCny,
          exchangeRate: exchangeRate,
          destinationId: data.destinationId,
        },
      });

      // Link to order if matched
      if (matchedOrder) {
        await tx.order.update({
          where: { id: matchedOrder.id },
          data: { packageId: pkg.id, status: 'MATCHED', matchedAt: new Date() },
        });
      } else {
        // If not matched, create unidentified package
        const count = await tx.unidentifiedPackage.count({ where: { companyId: data.companyId } });
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const tempCode = `UNID-${today}-${String(count + 1).padStart(3, '0')}`;
        const settings = await tx.platformSettings.findFirst();
        const storageDays = settings?.unidentifiedStorageDays || 90;

        const unidentified = await tx.unidentifiedPackage.create({
          data: {
            companyId: data.companyId,
            tempCode,
            partialTracking: data.trackingNumber,
            labelPhotoUrl: data.labelPhotoUrl || '',
            packagePhotos: data.packagePhotos,
            weightKg: data.weightKg,
            shelfLocation: data.shelfLocation,
            registeredBy: req.user!.userId,
            expiresAt: new Date(Date.now() + storageDays * 24 * 60 * 60 * 1000),
          },
        });
        return { pkg, unidentified, shippingCost };
      }

      return { pkg, unidentified: null, shippingCost };
    });

    // Notify customer if matched
    if (matchedOrder && matchedOrder.customerId) {
      await sendNotification(
        matchedOrder.customerId,
        'STATUS_UPDATE',
        'Ачаа агуулахад ирлээ',
        `Таны ${data.trackingNumber || 'ачаа'} хүлээн авах агуулахад бүртгэгдлээ. Төлөв: ${data.condition}`
      );
    }

    res.status(201).json({
      success: true,
      message: matchedOrder ? `Бараа бүртгэгдлээ → ${matchedOrder.orderCode}` : 'Эзэнгүй бараа бүртгэгдлээ',
      data: {
        package: {
          id: result.pkg.id,
          status: result.pkg.status,
          shippingCost: result.shippingCost,
          matched: !!matchedOrder,
          orderCode: matchedOrder?.orderCode,
          customerName: matchedOrder?.customer?.firstName,
        },
        unidentified: result.unidentified ? { id: result.unidentified.id, tempCode: result.unidentified.tempCode } : null,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/packages/bundle - Staff creates a bundle of packages
packagesRouter.post('/bundle', ensureVerifiedCargo, hasPermission('CAN_SCAN'), async (req, res, next) => {
  try {
    const data = createBundleSchema.parse(req.body);

    // Fetch all child packages to verify
    const children = await prisma.package.findMany({
      where: { id: { in: data.packageIds }, companyId: data.companyId }
    });

    if (children.length !== data.packageIds.length) {
      throw new AppError('Зарим ачаа олдсонгүй эсвэл өөр компанид харьяалагдаж байна', 400);
    }

    // Verify all belong to the same customer
    const customerId = children[0].customerId;
    const allSameCustomer = children.every(c => c.customerId === customerId);
    if (!allSameCustomer) {
      throw new AppError('Баглаанд орох ачаанууд бүгд нэг хэрэглэгчийнх байх ёстой', 400);
    }

    // Create bundle in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate totals if not provided
      const totalWeight = data.weightKg || children.reduce((sum, c) => sum + (c.weightKg || 0), 0);
      let cbm = null;
      if (data.lengthCm && data.widthCm && data.heightCm) {
        cbm = (data.lengthCm * data.widthCm * data.heightCm) / 1000000;
      } else {
        cbm = children.reduce((sum, c) => sum + (c.cbm || 0), 0);
      }

      // Generate bundle tracking code
      const count = await (tx as any).package.count({ where: { companyId: data.companyId, isBundle: true } });
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const bundleCode = `BNDL-${today}-${String(count + 1).padStart(4, '0')}`;

      // Create parent package
      const bundle = await (tx as any).package.create({
        data: {
          companyId: data.companyId,
          customerId,
          trackingNumber: bundleCode,
          description: data.description || `${children.length} ачааны баглаа`,
          weightKg: totalWeight,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          cbm,
          isBundle: true,
          status: 'MEASURED' as any,
          receivedAt: new Date(),
          measuredAt: new Date(),
          registeredById: req.user!.userId,
          shelfLocation: data.shelfLocation,
          warehouseId: data.warehouseId,
          serviceType: data.serviceType || children[0].serviceType || 'STANDARD',
        },
      });

      // Update children
      await (tx as any).package.updateMany({
        where: { id: { in: data.packageIds } },
        data: {
          parentId: bundle.id,
          status: 'BUNDLED' as any,
        },
      });

      return bundle;
    });

    res.status(201).json({ success: true, data: { bundle: result } });
  } catch (e) { next(e); }
});

// GET /api/packages - Company packages list
packagesRouter.get('/', authorize('STAFF_ERLIAN', 'STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.user!.companyId || (req.query.companyId as string);
    const status = req.query.status as string;
    const batchId = req.query.batchId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          order: { select: { orderCode: true, productTitle: true } },
          category: { select: { name: true } },
          batch: { select: { batchCode: true, status: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.package.count({ where }),
    ]);

    res.json({ success: true, data: { packages, total, page, limit } });
  } catch (e) { next(e); }
});

// PATCH /api/packages/:id/measure - Update measurement
packagesRouter.patch('/:id/measure', ensureVerifiedCargo, hasPermission('CAN_MEASURE'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { weightKg, lengthCm, widthCm, heightCm, categoryId } = req.body;

    let cbm = null;
    if (lengthCm && widthCm && heightCm) {
      cbm = (lengthCm * widthCm * heightCm) / 1000000;
    }

    // Recalculate shipping cost
    const pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new AppError('Бараа олдсонгүй', 404);

    let shippingCost = pkg.shippingCost;
    const finalWeight = weightKg !== undefined ? weightKg : pkg.weightKg;
    const finalCategory = (typeof categoryId === 'string' ? categoryId : pkg.categoryId) as string | null;

    if (finalWeight) {
      const pricingRule = await prisma.pricingRule.findFirst({
        where: {
          companyId: pkg.companyId,
          isActive: true,
          serviceType: pkg.serviceType,
          ...(finalCategory ? { categoryId: finalCategory } : { isDefault: true }),
        },
      });
      if (pricingRule) {
        const wCost = Number(finalWeight) * Number(pricingRule.pricePerKg);
        const cCost = cbm && pricingRule.pricePerCbm ? cbm * Number(pricingRule.pricePerCbm) : 0;
        shippingCost = Math.max(wCost, cCost);
      }
    }

    const updated = await prisma.package.update({
      where: { id: req.params.id as string },
      data: {
        weightKg: finalWeight,
        lengthCm,
        widthCm,
        heightCm,
        cbm,
        categoryId: finalCategory,
        shippingCost,
        status: 'MEASURED' as any,
        measuredAt: new Date(),
      },
    } as any);

    res.json({ success: true, data: { package: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/packages/:id/status - Update status
packagesRouter.patch('/:id/status', ensureVerifiedCargo, hasAnyPermission(['CAN_SCAN', 'CAN_MEASURE', 'CAN_BATCH', 'CAN_PICKUP']), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { status, shelfLocation, warehouseId } = req.body;
    if (!status) throw new AppError('Төлөв оруулна уу', 400);

    const updateData: any = { status };

    if (status === 'DEPARTED') updateData.departedAt = new Date();
    if (status === 'ARRIVED_HUB') updateData.arrivedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (shelfLocation) updateData.shelfLocation = shelfLocation;
    if (warehouseId) updateData.warehouseId = warehouseId;

    const updated = await prisma.package.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { package: updated } });
  } catch (e) { next(e); }
});

// GET /api/packages/search/pickup - Search for packages ready for pickup
packagesRouter.get('/search/pickup', authorize('STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { query } = req.query; // phone or orderCode
    if (!query) throw new AppError('Хайх утга оруулна уу', 400);

    const packages = await prisma.package.findMany({
      where: {
        OR: [
          { customer: { phone: { contains: query as string } } },
          { order: { orderCode: { contains: query as string } } },
          { trackingNumber: { contains: query as string } },
        ],
        status: { in: ['ARRIVED_HUB', 'SHELVED_HUB', 'READY_FOR_PICKUP'] },
        companyId: req.user!.companyId || undefined,
      },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        order: { select: { orderCode: true } },
        invoiceItems: {
          include: { invoice: { select: { status: true, totalAmount: true, invoiceCode: true } } },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
      }
    });

    res.json({ success: true, data: { packages } });
  } catch (e) { next(e); }
});

// POST /api/packages/confirm-pickup - Confirm pickup and mark as delivered
packagesRouter.post('/confirm-pickup', authorize('STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { label } = req.body; // Package ID or Tracking Number
    if (!label) throw new AppError('Барааны дугаар эсвэл ID шаардлагатай', 400);

    const pkg = await prisma.package.findFirst({
      where: {
        OR: [{ id: label }, { trackingNumber: label }],
        companyId: req.user!.companyId || undefined,
      },
      include: {
        invoiceItems: {
          include: { invoice: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!pkg) throw new AppError('Бараа олдсонгүй', 404);

    // Check if invoiced and paid
    const lastInvoiceItem = pkg.invoiceItems[0];
    if (!lastInvoiceItem) {
      throw new AppError('Уг бараанд нэхэмжлэх үүсээгүй байна', 400);
    }

    if (lastInvoiceItem.invoice.status !== 'PAID') {
      throw new AppError(`Төлбөр төлөгдөөгүй байна. Нэхэмжлэх: ${lastInvoiceItem.invoice.invoiceCode}`, 400);
    }

    const updated = await prisma.package.update({
      where: { id: pkg.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      },
    });

    // Also update order if exists
    await prisma.order.updateMany({
      where: { packageId: pkg.id },
      data: { status: 'COMPLETED' }
    });

    res.json({
      success: true,
      message: 'Бараа амжилттай олгогдлоо',
      data: { package: updated }
    });
  } catch (e) { next(e); }
});

// PATCH /api/packages/:id/qc-report - Staff uploads QC report
packagesRouter.patch('/:id/qc-report', ensureVerifiedCargo, hasPermission('CAN_SCAN'), async (req, res, next) => {
  try {
    const { qcNotes, qcReportUrl, qcPhotos } = req.body;
    const { id } = req.params;

    const pkg = await prisma.package.findUnique({
      where: { id: id as string },
      include: { order: true }
    });
    if (!pkg) throw new AppError('Бараа олдсонгүй', 404);

    if (pkg.order) {
      if ((pkg.order as any).qcStatus !== 'PAID' && (pkg.order as any).qcStatus !== 'IN_PROGRESS') {
        throw new AppError('QC төлбөр төлөгдөөгүй байна', 400);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.package.update({
        where: { id: id as string },
        data: {
          qcNotes,
          qcReportUrl,
          qcPhotos,
          qcCompleted: true,
          qcStaffId: req.user!.userId,
        } as any,
      });

      if (pkg.order) {
        await tx.order.update({
          where: { id: pkg.order.id },
          data: { qcStatus: 'COMPLETED' }
        });
      }
      return p;
    });

    // Notify customer
    if (pkg.customerId) {
      await sendNotification(
        pkg.customerId,
        'QC_COMPLETED',
        'Чанарын шалгалт дууслаа',
        `Таны ${pkg.trackingNumber || pkg.id} дугаартай барааны чанарын шалгалтын тайлан бэлэн боллоо.`
      );
    }

    res.json({ success: true, data: { package: updated } });
  } catch (e) { next(e); }
});
