import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';
import { LiableParty, ReturnStatus } from '@prisma/client';
import { EbarimtService } from '../../services/ebarimt.service';

export const returnsRouter = Router();
returnsRouter.use(authenticate);

const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  returnType: z.enum([
    'NOT_ARRIVED_ERLIAN', 'DAMAGED_AT_ERLIAN', 'PROHIBITED_ITEM',
    'DAMAGED_IN_TRANSIT', 'LOST_IN_TRANSIT', 'NOT_ARRIVED_UB',
    'DAMAGED_AT_UB', 'WRONG_DELIVERY', 'CUSTOMS_HELD',
    'CUSTOMS_REJECTED', 'WRONG_ITEM', 'QUALITY_ISSUE', 'OTHER',
  ]),
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  evidencePhotos: z.array(z.string()).min(1),
});

// ═══ Liability Detection ═══

function autoDetectLiability(returnType: string, pkg: any): { party: LiableParty; reason: string } {
  switch (returnType) {
    case 'PROHIBITED_ITEM':
      return { party: 'CUSTOMER', reason: 'Хориглосон бараа захиалсан — захиалагч хариуцна' };

    case 'NOT_ARRIVED_ERLIAN':
      return { party: 'INTL_CARRIER', reason: 'Олон улсын тээвэр хүргээгүй — эх үүсвэр тээврийн компани хариуцна' };

    case 'DAMAGED_AT_ERLIAN':
      return { party: 'INTL_CARRIER', reason: 'Эрээнд ирэхээс өмнө гэмтсэн — эх үүсвэр тээврийн компани хариуцна' };

    case 'DAMAGED_IN_TRANSIT':
      return { party: 'CARGO_TRANSIT', reason: 'Тээвэрлэлтийн явцад гэмтсэн — карго компани хариуцна' };

    case 'LOST_IN_TRANSIT':
      return { party: 'CARGO_TRANSIT', reason: 'Тээвэрлэлтийн явцад алга болсон — карго компани хариуцна' };

    case 'NOT_ARRIVED_UB':
      return { party: 'CARGO_TRANSIT', reason: 'УБ-д ирээгүй — карго компани хариуцна' };

    case 'DAMAGED_AT_UB':
      return { party: 'CARGO_MONGOLIA', reason: 'УБ агуулахад гэмтсэн — карго компани (Монгол тал) хариуцна' };

    case 'WRONG_DELIVERY':
      return { party: 'CARGO_MONGOLIA', reason: 'Буруу хүнд олгосон — карго компани хариуцна' };

    case 'WRONG_ITEM':
    case 'QUALITY_ISSUE':
      return { party: 'SELLER', reason: 'Худалдагчийн буруу — худалдагчтай шийдвэрлэнэ' };

    default:
      return { party: 'UNDETERMINED', reason: 'Шалгалт хийх шаардлагатай' };
  }
}

// ═══ Routes ═══

// POST /api/returns - Customer opens return
returnsRouter.post('/', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const data = createReturnSchema.parse(req.body);
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        package: true,
        insurance: true,
        company: true,
      },
    });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.customerId !== userId) throw new AppError('Эрх хүрэлцэхгүй', 403);

    // Generate return code
    const count = await prisma.returnRequest.count({ where: { companyId: order.companyId } });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const returnCode = `RET-${today}-${String(count + 1).padStart(3, '0')}`;

    // Auto-detect liability
    const liability = autoDetectLiability(data.returnType, order.package);

    const returnReq = await prisma.returnRequest.create({
      data: {
        companyId: order.companyId,
        customerId: userId,
        orderId: order.id,
        returnCode,
        returnType: data.returnType as any,
        title: data.title,
        description: data.description,
        evidencePhotos: data.evidencePhotos,
        liableParty: liability.party,
        liabilityReason: liability.reason,
        systemEvidence: {
          autoDetected: true,
          hasInsurance: !!order.insurance,
          insurancePlan: order.insurance?.planSlug,
          packageStatus: order.package?.status,
        },
        status: 'OPENED',
        timeline: {
          create: {
            action: 'RETURN_OPENED',
            actorId: userId,
            actorRole: 'customer',
            message: `Буцаалт нээсэн: ${data.title}`,
            newStatus: 'OPENED',
          },
        },
      },
      include: { timeline: true },
    });

    res.status(201).json({
      success: true,
      message: 'Буцаалтын хүсэлт амжилттай илгээгдлээ',
      data: {
        return: {
          id: returnReq.id,
          returnCode: returnReq.returnCode,
          status: returnReq.status,
          liableParty: returnReq.liableParty,
          liabilityReason: returnReq.liabilityReason,
        },
      },
    });
  } catch (e) { next(e); }
});

// PATCH /api/returns/:id/review - Staff reviews return
returnsRouter.patch('/:id/review', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status, liableParty, liabilityReason, approvedAmount, reviewNotes } = req.body;
    if (!status) throw new AppError('Шийдвэр оруулна уу', 400);

    const returnReq = await prisma.returnRequest.findUnique({
      where: { id: req.params.id as string },
      include: {
        order: { include: { insurance: true, package: true } },
      },
    });
    if (!returnReq) throw new AppError('Буцаалт олдсонгүй', 404);

    const updateData: any = {
      status,
      reviewedBy: req.user!.userId,
      reviewedAt: new Date(),
    };
    if (liableParty) updateData.liableParty = liableParty;
    if (liabilityReason) updateData.liabilityReason = liabilityReason;
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount;

    const updated = await prisma.returnRequest.update({
      where: { id: req.params.id as string },
      data: updateData,
    });

    // Add timeline entry
    await prisma.returnTimeline.create({
      data: {
        returnId: req.params.id as string,
        action: 'REVIEWED',
        actorId: req.user!.userId,
        actorRole: req.user!.role === 'SUPER_ADMIN' ? 'admin' : 'staff',
        message: reviewNotes || `Шийдвэр: ${status}`,
        oldStatus: returnReq.status,
        newStatus: status,
      },
    });

    // If approved, create refund
    if (status === 'APPROVED' && approvedAmount > 0) {
      const invoice = await prisma.invoice.findFirst({
        where: { customerId: returnReq.customerId, items: { some: { packageId: returnReq.order?.packageId || undefined } } },
      });

      // Revoke E-barimt if exists
      if (invoice && invoice.ebarimtBillId && invoice.ebarimtStatus === 'SUCCESS') {
        await EbarimtService.revokeBill(invoice.id);
      }

      let shippingRefund = 0;
      let customsRefund = 0;
      let insurancePayout = 0;
      let compensation = 0;

      const isCargoLiable = ['CARGO_ERLIAN', 'CARGO_TRANSIT', 'CARGO_MONGOLIA'].includes(
        updated.liableParty
      );

      if (isCargoLiable && invoice) {
        shippingRefund = Number(invoice.shippingAmount);
        customsRefund = Number(invoice.customsAmount);
      }

      // Zamex Shield (Risk Fund) Payout Logic
      const netLoss = Math.max(0, approvedAmount - shippingRefund - customsRefund);

      if (returnReq.order?.insurance && returnReq.order.insurance.status === 'ACTIVE') {
        const ins = returnReq.order.insurance;

        // Shield active: 50% coverage rule for non-customer liability
        if (updated.liableParty !== 'CUSTOMER') {
          let coverageAmount = netLoss * 0.5;
          insurancePayout = Math.min(coverageAmount, Number(ins.maxPayout));
        } else {
          insurancePayout = 0;
        }

        // Update insurance status
        await prisma.packageInsurance.update({
          where: { id: ins.id },
          data: { status: 'CLAIMED' },
        });

        await prisma.insuranceClaim.create({
          data: {
            insuranceId: ins.id,
            returnId: returnReq.id,
            claimType: returnReq.returnType,
            claimedAmount: approvedAmount,
            approvedAmount: insurancePayout,
            status: 'APPROVED',
            reviewedBy: req.user!.userId,
            reviewedAt: new Date(),
          },
        });

        // Deduct from Risk Fund
        if (insurancePayout > 0) {
          const lastFund = await prisma.insuranceFundTransaction.findFirst({
            orderBy: { createdAt: 'desc' },
          });
          const balance = lastFund ? Number(lastFund.balance) : 0;

          await prisma.insuranceFundTransaction.create({
            data: {
              transactionType: 'PAYOUT_OUT',
              amount: -insurancePayout,
              balance: balance - insurancePayout,
              referenceId: returnReq.id,
              referenceType: 'return',
              description: `Бамбай нөхөн олговор: ${returnReq.returnCode}`,
            },
          });
        }
      } else {
        // No Shield: Liable party pays 100% of the net loss
        insurancePayout = 0;
      }

      // Remaining amount is compensation charged to the Liable Party
      compensation = Math.max(0, approvedAmount - shippingRefund - customsRefund - insurancePayout);

      await prisma.refundTransaction.create({
        data: {
          returnId: returnReq.id,
          amount: approvedAmount,
          shippingRefund,
          customsRefund,
          insurancePayout,
          compensation,
          chargedTo: updated.liableParty as any,
          status: 'PROCESSING',
        },
      });

      await prisma.returnRequest.update({
        where: { id: req.params.id as string },
        data: { status: 'REFUND_PROCESSING' },
      });
    }

    res.json({ success: true, data: { return: updated } });
  } catch (e) { next(e); }
});

// GET /api/returns - List returns
returnsRouter.get('/', async (req, res, next) => {
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

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: {
          order: { select: { orderCode: true, productTitle: true } },
          customer: { select: { firstName: true, phone: true } },
          company: { select: { name: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.returnRequest.count({ where }),
    ]);

    res.json({ success: true, data: { returns, total, page, limit } });
  } catch (e) { next(e); }
});

// GET /api/returns/:id
returnsRouter.get('/:id', async (req, res, next) => {
  try {
    const ret = await prisma.returnRequest.findUnique({
      where: { id: req.params.id },
      include: {
        order: { include: { insurance: true } },
        customer: { select: { id: true, firstName: true, phone: true } },
        company: { select: { name: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        refundTxns: true,
      },
    });
    if (!ret) throw new AppError('Буцаалт олдсонгүй', 404);

    if (req.user!.role === 'CUSTOMER' && ret.customerId !== req.user!.userId) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    res.json({ success: true, data: { return: ret } });
  } catch (e) { next(e); }
});
