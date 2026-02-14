import { Router } from 'express';
import { prisma } from '../../server';

export const specializationsRouter = Router();

// GET /api/specializations
specializationsRouter.get('/', async (req, res, next) => {
    try {
        const specializations = await prisma.specialization.findMany({
            orderBy: { nameMn: 'asc' }
        });
        res.json({ success: true, data: { specializations } });
    } catch (e) { next(e); }
});
