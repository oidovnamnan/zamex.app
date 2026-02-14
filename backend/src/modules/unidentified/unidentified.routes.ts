import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const unidentifiedRouter = Router();
unidentifiedRouter.use(authenticate);
unidentifiedRouter.use(authorize('STAFF_ERLIAN', 'STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'));

// GET /api/unidentified
unidentifiedRouter.get('/', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId || (req.query.companyId as string);
    const status = req.query.status as string || 'STORED';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.unidentifiedPackage.findMany({
        where,
        include: { matchSuggestions: { where: { status: 'PENDING' }, take: 3 } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.unidentifiedPackage.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) { next(e); }
});

// POST /api/unidentified/:id/match - Manually match with order
unidentifiedRouter.post('/:id/match', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) throw new AppError('orderId шаардлагатай', 400);

    const unid = await prisma.unidentifiedPackage.findUnique({ where: { id: req.params.id } });
    if (!unid) throw new AppError('Эзэнгүй бараа олдсонгүй', 404);
    if (unid.status !== 'STORED') throw new AppError('Аль хэдийн дүйцүүлэгдсэн', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.packageId) throw new AppError('Захиалгад аль хэдийн бараа холбогдсон', 400);

    // Create package from unidentified
    const pkg = await prisma.package.create({
      data: {
        companyId: unid.companyId,
        customerId: order.customerId,
        trackingNumber: unid.partialTracking,
        weightKg: unid.weightKg,
        labelPhotoUrl: unid.labelPhotoUrl,
        packagePhotos: unid.packagePhotos as any,
        shelfLocation: unid.shelfLocation,
        status: 'RECEIVED_ORIGIN',
        receivedAt: unid.storedAt,
        registeredById: req.user!.userId,
      },
    });

    // Link order
    await prisma.order.update({
      where: { id: orderId },
      data: { packageId: pkg.id, status: 'MATCHED', matchedAt: new Date() },
    });

    // Update unidentified
    await prisma.unidentifiedPackage.update({
      where: { id: req.params.id },
      data: { status: 'MATCHED', matchedAt: new Date() },
    });

    res.json({
      success: true,
      message: `Бараа ${order.orderCode}-тай холбогдлоо`,
      data: { package: pkg },
    });
  } catch (e) { next(e); }
});

// POST /api/unidentified/auto-match - Run auto-matching for a company
unidentifiedRouter.post('/auto-match', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.user!.companyId || req.body.companyId;
    if (!companyId) throw new AppError('companyId шаардлагатай', 400);

    const unidentified = await prisma.unidentifiedPackage.findMany({
      where: { companyId, status: 'STORED' },
    });

    const pendingOrders = await prisma.order.findMany({
      where: { companyId, status: { in: ['PENDING', 'PRE_ANNOUNCED'] }, packageId: null },
    });

    let matchCount = 0;
    const suggestions: any[] = [];

    for (const unid of unidentified) {
      for (const order of pendingOrders) {
        let confidence = 0;
        const matchedFields: string[] = [];

        // Match by tracking
        if (unid.partialTracking && order.trackingNumber) {
          if (order.trackingNumber.includes(unid.partialTracking) || unid.partialTracking.includes(order.trackingNumber)) {
            confidence += 60;
            matchedFields.push('tracking');
          }
        }

        // Match by phone
        if (unid.partialPhone) {
          const customer = await prisma.user.findUnique({ where: { id: order.customerId }, select: { phone: true } });
          if (customer?.phone.includes(unid.partialPhone)) {
            confidence += 30;
            matchedFields.push('phone');
          }
        }

        // Match by name
        if (unid.partialName) {
          const customer = await prisma.user.findUnique({ where: { id: order.customerId }, select: { firstName: true } });
          if (customer?.firstName.toLowerCase().includes(unid.partialName.toLowerCase())) {
            confidence += 20;
            matchedFields.push('name');
          }
        }

        if (confidence >= 50) {
          await prisma.matchSuggestion.create({
            data: {
              companyId,
              orderId: order.id,
              unidentifiedId: unid.id,
              confidence,
              matchedFields,
              reasoning: `Дүйцсэн: ${matchedFields.join(', ')} (${confidence}%)`,
            },
          });
          suggestions.push({ unid: unid.tempCode, order: order.orderCode, confidence });
          matchCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `${matchCount} дүйцэл олдлоо`,
      data: { suggestions, totalUnidentified: unidentified.length, totalPendingOrders: pendingOrders.length },
    });
  } catch (e) { next(e); }
});
