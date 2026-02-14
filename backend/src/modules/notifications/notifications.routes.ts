import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

// GET /api/notifications
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({ success: true, data: { notifications, total, unreadCount, page, limit } });
  } catch (e) { next(e); }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// ═══ Helper: Send notification ═══
export async function sendNotification(userId: string, type: string, title: string, message: string, data?: any) {
  return prisma.notification.create({
    data: { userId, type, title, message, data },
  });
}
