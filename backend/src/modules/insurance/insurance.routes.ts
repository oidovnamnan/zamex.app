import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const insuranceRouter = Router();

// ═══ Validation ═══
const createClaimSchema = z.object({
    orderId: z.string(),
    claimType: z.string(),
    requestedAmount: z.number().min(0),
    description: z.string().min(10).optional(),
});

// ═══ Routes ═══

// GET /api/insurance/plans - Get insurance plan info from platform settings
insuranceRouter.get('/plans', async (req, res, next) => {
    try {
        const settings = await prisma.platformSettings.findFirst();
        if (!settings) throw new AppError('Тохиргоо олдсонгүй', 404);

        const plans = [
            { slug: 'BASIC', rate: settings.insuranceBasicRate, coverage: settings.insuranceBasicCoverage, max: settings.insuranceBasicMax },
            { slug: 'STANDARD', rate: settings.insuranceStandardRate, coverage: settings.insuranceStandardCoverage, max: settings.insuranceStandardMax },
            { slug: 'PREMIUM', rate: settings.insurancePremiumRate, coverage: settings.insurancePremiumCoverage, max: settings.insurancePremiumMax },
        ];
        res.json({ success: true, data: { plans } });
    } catch (e) { next(e); }
});

// POST /api/insurance/claims - Customer submits a claim
insuranceRouter.post('/claims', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
    try {
        const data = createClaimSchema.parse(req.body);
        const userId = req.user!.userId;

        // Check if order belongs to user and has insurance
        const order = await prisma.order.findFirst({
            where: { id: data.orderId, customerId: userId },
            include: { insurance: true }
        });

        if (!order) throw new AppError('Захиалга олдсонгүй', 404);
        if (!order.insurance) throw new AppError('Энэ захиалга даатгалгүй байна', 400);

        const claim = await prisma.insuranceClaim.create({
            data: {
                insuranceId: order.insurance.id,
                claimType: data.claimType,
                claimedAmount: data.requestedAmount,
                description: data.description,
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, data: { claim } });
    } catch (e) { next(e); }
});

// GET /api/insurance/claims - View claims
insuranceRouter.get('/claims', authenticate, async (req, res, next) => {
    try {
        const { role, companyId } = req.user!;

        const where: any = {};
        if (role === 'CARGO_ADMIN') {
            where.insurance = { order: { companyId } };
        } else if (role === 'CUSTOMER') {
            where.insurance = { order: { customerId: req.user!.userId } };
        }

        const claims = await prisma.insuranceClaim.findMany({
            where,
            include: {
                insurance: {
                    include: {
                        order: {
                            select: { orderCode: true, productTitle: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: { claims } });
    } catch (e) { next(e); }
});

// PATCH /api/insurance/claims/:id - Process claim
insuranceRouter.patch('/claims/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const { status, approvedAmount, notes } = req.body;

        const oldClaim = await prisma.insuranceClaim.findUnique({
            where: { id },
        });
        if (!oldClaim) throw new AppError('Нөхөн олговрын хүсэлт олдсонгүй', 404);

        const claim = await prisma.insuranceClaim.update({
            where: { id },
            data: {
                status,
                approvedAmount: status === 'REJECTED' ? 0 : approvedAmount,
                reviewedBy: req.user!.userId,
                reviewedAt: new Date(),
            }
        });

        // If approved, record payout in fund
        if (status === 'APPROVED' && oldClaim.status !== 'APPROVED') {
            const payoutAmount = Number(approvedAmount || 0);
            if (payoutAmount > 0) {
                const lastFund = await prisma.insuranceFundTransaction.findFirst({
                    orderBy: { createdAt: 'desc' },
                });
                const currentBalance = lastFund ? Number(lastFund.balance) : 0;

                await prisma.insuranceFundTransaction.create({
                    data: {
                        transactionType: 'CLAIM_PAYOUT',
                        amount: -payoutAmount,
                        balance: currentBalance - payoutAmount,
                        referenceId: claim.id,
                        referenceType: 'insurance_claim',
                        description: `Нөхөн олговор: ${notes || ''}`,
                    },
                });
            }
        }

        res.json({ success: true, data: { claim } });
    } catch (e) { next(e); }
});
// GET /api/insurance/fund - Admin views fund status
insuranceRouter.get('/fund', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const transactions = await prisma.insuranceFundTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Use the balance from the latest transaction or calculate
        const latestTx = await prisma.insuranceFundTransaction.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        const totalInAgg = await prisma.insuranceFundTransaction.aggregate({
            _sum: { amount: true },
            where: { amount: { gt: 0 } }
        });

        const totalOutAgg = await prisma.insuranceFundTransaction.aggregate({
            _sum: { amount: true },
            where: { amount: { lt: 0 } }
        });

        const balance = latestTx?.balance || 0;

        // Get fund target from settings
        const settings = await prisma.platformSettings.findFirst();

        res.json({
            success: true,
            data: {
                balance,
                totalIn: totalInAgg._sum.amount || 0,
                totalOut: Math.abs(totalOutAgg._sum.amount || 0),
                target: Number(settings?.insuranceFundTarget || 10000000),
                transactions
            }
        });
    } catch (e) { next(e); }
});
