import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get public delivery points (for selection)
router.get('/public', async (req, res) => {
    try {
        const points = await (prisma as any).deliveryPoint.findMany({
            where: { isActive: true },
            include: {
                company: {
                    select: { name: true }
                }
            }
        });
        res.json({ data: { points } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch delivery points' });
    }
});

// Admin: Manage delivery points
router.get('/', authenticate as any, authorize('SUPER_ADMIN', 'CARGO_ADMIN') as any, async (req, res) => {
    try {
        const { companyId, role } = (req as any).user;
        const where = role === 'SUPER_ADMIN' ? {} : { companyId };

        const points = await (prisma as any).deliveryPoint.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ data: { points } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch delivery points' });
    }
});

router.post('/', authenticate as any, authorize('SUPER_ADMIN', 'CARGO_ADMIN') as any, async (req, res) => {
    try {
        const { name, address, latitude, longitude, contact, type, companyId } = req.body;
        const user = (req as any).user;

        // For CARGO_ADMIN, force their own company
        const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId;

        const point = await (prisma as any).deliveryPoint.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                contact,
                type,
                companyId: targetCompanyId
            }
        });

        res.json({ data: { point } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create delivery point' });
    }
});

router.patch('/:id', authenticate as any, authorize('SUPER_ADMIN', 'CARGO_ADMIN') as any, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, latitude, longitude, contact, type, isActive } = req.body;

        const point = await (prisma as any).deliveryPoint.update({
            where: { id },
            data: { name, address, latitude, longitude, contact, type, isActive }
        });

        res.json({ data: { point } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update delivery point' });
    }
});

// User: Set delivery point for order
router.patch('/orders/:orderId', authenticate as any, authorize('CUSTOMER', 'SUPER_ADMIN', 'CARGO_ADMIN') as any, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryPointId } = req.body;
        const user = (req as any).user;

        // Check ownership if customer
        if (user.role === 'CUSTOMER') {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order || order.customerId !== user.userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        const order = await (prisma.order as any).update({
            where: { id: orderId },
            data: { deliveryPointId: deliveryPointId || null }
        });

        res.json({ data: { order } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set delivery point' });
    }
});

export default router;
