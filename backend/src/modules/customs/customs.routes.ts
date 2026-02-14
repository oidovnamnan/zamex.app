import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const customsRouter = Router();

// ═══ Validation ═══
const updateCustomsSchema = z.object({
    hsCode: z.string().optional(),
    declaredValue: z.number().min(0).optional(),
    dutyAmount: z.number().min(0).optional(),
    vatAmount: z.number().min(0).optional(),
    totalCustomsFee: z.number().min(0).optional(),
    declarationStatus: z.string().optional(),
});

// ═══ Routes ═══

// GET /api/customs/hs-codes - Search HS codes
customsRouter.get('/hs-codes', authenticate, async (req, res, next) => {
    try {
        const q = req.query.q as string;
        const hsCodes = await prisma.hsCode.findMany({
            where: q ? {
                OR: [
                    { code: { contains: q } },
                    { nameMn: { contains: q } },
                    { nameEn: { contains: q } },
                ]
            } : {},
            take: 20
        });
        res.json({ success: true, data: { hsCodes } });
    } catch (e) { next(e); }
});

// POST /api/customs/calculate - Placeholder for duties calculation
customsRouter.post('/calculate', authenticate, async (req, res, next) => {
    try {
        const { packageId, value } = req.body;
        // Logic: 15% duty, 10% VAT
        const dutyAmount = value * 0.05;
        const vatAmount = (value + dutyAmount) * 0.10;

        res.json({
            success: true,
            data: {
                declaredValue: value,
                dutyAmount,
                vatAmount,
                totalTaxes: dutyAmount + vatAmount
            }
        });
    } catch (e) { next(e); }
});

// PATCH /api/customs/:packageId - Update customs info
customsRouter.patch('/:packageId', authenticate, authorize('CARGO_ADMIN'), async (req, res, next) => {
    try {
        const packageId = req.params.packageId as string;
        const data = updateCustomsSchema.parse(req.body);

        const customs = await prisma.packageCustoms.upsert({
            where: { packageId },
            update: data,
            create: {
                packageId,
                ...data
            }
        });

        res.json({ success: true, data: { customs } });
    } catch (e) { next(e); }
});

// GET /api/customs/:packageId - Get customs info for a package
customsRouter.get('/:packageId', authenticate, async (req, res, next) => {
    try {
        const customs = await prisma.packageCustoms.findUnique({
            where: { packageId: req.params.packageId as string }
        });
        res.json({ success: true, data: { customs } });
    } catch (e) { next(e); }
});
