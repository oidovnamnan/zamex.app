import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const settlementsRouter = Router();
settlementsRouter.use(authenticate);
settlementsRouter.use(authorize('CARGO_ADMIN', 'SUPER_ADMIN'));

// POST /api/settlements/generate - Generate weekly settlement for a company
settlementsRouter.post('/generate', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { companyId, periodStart, periodEnd } = req.body;
    if (!companyId || !periodStart || !periodEnd) throw new AppError('companyId, periodStart, periodEnd шаардлагатай', 400);

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // 1. HUB SETTLEMENT (Income as a Cargo Hub)
    const hubFees = await (prisma as any).platformFee.findMany({
      where: {
        companyId,
        invoice: {
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
      },
    });

    let hubSettlement = null;
    if (hubFees.length > 0) {
      const totalShippingRevenue = hubFees.reduce((s: number, f: any) => s + Number(f.shippingAmount), 0);
      const totalPlatformFees = hubFees.reduce((s: number, f: any) => s + Number(f.feeAmount), 0);
      const totalQpayFees = hubFees.reduce((s: number, f: any) => s + Number(f.qpayFee), 0);
      const totalCarrierPayable = hubFees.reduce((s: number, f: any) => s + Number(f.carrierAmount || 0), 0);

      const refunds = await prisma.refundTransaction.findMany({
        where: {
          request: { companyId },
          status: 'COMPLETED',
          processedAt: { gte: start, lte: end },
          chargedTo: { in: ['HUB_ORIGIN', 'HUB_TRANSIT', 'HUB_DESTINATION'] as any },
        },
      });
      const totalRefunds = refunds.reduce((s, r) => s + Number(r.shippingRefund) + Number(r.compensation), 0);

      // Net to Hub = Shipping - PlatformFees - QpayFees - CarrierPayable - Refunds
      const netAmount = totalShippingRevenue - totalPlatformFees - totalQpayFees - totalCarrierPayable - totalRefunds;

      hubSettlement = await (prisma as any).settlement.create({
        data: {
          companyId,
          carrierId: null,
          periodStart: start,
          periodEnd: end,
          totalShippingRevenue,
          totalPlatformFees,
          totalQpayFees,
          totalRefunds,
          carrierAmount: totalCarrierPayable,
          originalAmount: netAmount,
          netAmount,
          status: 'PENDING',
        },
      });
    }

    // 2. CARRIER SETTLEMENT (Income as a Transport Carrier)
    const carrierFees = await (prisma as any).platformFee.findMany({
      where: {
        carrierId: companyId,
        invoice: {
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
      },
    });

    let transportSettlement = null;
    if (carrierFees.length > 0) {
      const totalTransportRevenue = carrierFees.reduce((s: number, f: any) => s + Number(f.carrierAmount || 0), 0);

      transportSettlement = await (prisma as any).settlement.create({
        data: {
          companyId,
          carrierId: companyId, // Self-carrier flag
          periodStart: start,
          periodEnd: end,
          totalShippingRevenue: totalTransportRevenue,
          totalPlatformFees: 0,
          totalQpayFees: 0,
          totalRefunds: 0,
          carrierAmount: totalTransportRevenue,
          originalAmount: totalTransportRevenue,
          netAmount: totalTransportRevenue,
          status: 'PENDING',
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        hubSettlement,
        transportSettlement
      }
    });
  } catch (e) { next(e); }
});

// PATCH /api/settlements/:id/hub-review - Hub Admin reviews/adjusts carrier settlement
settlementsRouter.patch('/:id/hub-review', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { adjustmentAmount, adjustmentNote, status } = req.body; // status: APPROVED or ADJUSTED
    const settlement = await (prisma as any).settlement.findUnique({ where: { id: req.params.id } });
    if (!settlement) throw new AppError('Тооцоолол олдсонгүй', 404);

    const adj = Number(adjustmentAmount || 0);
    const finalAmount = Number(settlement.originalAmount || 0) + adj;

    const updated = await (prisma as any).settlement.update({
      where: { id: req.params.id },
      data: {
        adjustmentAmount: adj,
        adjustmentNote,
        netAmount: finalAmount,
        hubApprovalStatus: status,
        status: status === 'APPROVED' ? 'HUB_APPROVED' : 'PENDING',
      },
    });
    res.json({ success: true, data: { settlement: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/settlements/:id/carrier-review - Carrier Admin accepts/rejects
settlementsRouter.patch('/:id/carrier-review', async (req, res, next) => {
  try {
    const { status } = req.body; // status: ACCEPTED or REJECTED
    const settlement = await (prisma as any).settlement.findUnique({ where: { id: req.params.id } });
    if (!settlement) throw new AppError('Тооцоолол олдсонгүй', 404);

    // Security: Only the company that owns the settlement can review it
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.companyId !== settlement.companyId) {
      throw new AppError('Энэ тооцоог батлах эрхгүй байна', 403);
    }

    const isRejected = status === 'REJECTED';

    const updated = await (prisma as any).settlement.update({
      where: { id: req.params.id },
      data: {
        carrierApprovalStatus: status,
        // If rejected, reset hub approval so they can adjust again
        hubApprovalStatus: isRejected ? 'PENDING' : settlement.hubApprovalStatus,
        status: isRejected ? 'DISPUTED' : 'CARRIER_ACCEPTED',
      },
    });
    res.json({ success: true, data: { settlement: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/settlements/:id/transfer - Mark as transferred
settlementsRouter.patch('/:id/transfer', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { bankName, bankAccount, transferReference, transferReceiptUrl } = req.body;

    // Get settlement to find company bank details if not provided
    const settlement = await (prisma as any).settlement.findUnique({
      where: { id: req.params.id as string },
      include: { company: true }
    });
    if (!settlement) throw new AppError('Тооцоолол олдсонгүй', 404);

    const updated = await (prisma as any).settlement.update({
      where: { id: req.params.id as string },
      data: {
        status: 'COMPLETED',
        bankName: (bankName || settlement.company.bankNameMn) as string,
        bankAccount: (bankAccount || settlement.company.bankAccountMn) as string,
        transferReference: transferReference as string,
        transferReceiptUrl: transferReceiptUrl as string,
        transferredAt: new Date(),
      },
    });
    res.json({ success: true, data: { settlement: updated } });
  } catch (e) { next(e); }
});

// GET /api/settlements
settlementsRouter.get('/', async (req, res, next) => {
  try {
    const companyId = req.user!.role === 'SUPER_ADMIN' ? (req.query.companyId as string) : req.user!.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: any = {};
    if (companyId) where.companyId = companyId;

    const [settlements, total] = await Promise.all([
      (prisma as any).settlement.findMany({
        where,
        include: {
          company: {
            include: {
              paymentAccounts: {
                where: { isActive: true },
                orderBy: { isDefault: 'desc' }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.settlement.count({ where }),
    ]);

    res.json({ success: true, data: { settlements, total, page, limit } });
  } catch (e) { next(e); }
});
