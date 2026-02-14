import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const ratingsRouter = Router();
ratingsRouter.use(authenticate);

const createRatingSchema = z.object({
  orderId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  speedRating: z.number().int().min(1).max(5).optional(),
  safetyRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
  priceRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
});

// ═══ Recalculate company rating ═══

async function recalculateCompanyRating(companyId: string) {
  const ratings = await prisma.rating.findMany({
    where: { companyId, isVisible: true },
  });

  if (ratings.length === 0) return;

  const totalRatings = ratings.length;
  const avg = (field: keyof typeof ratings[0]) =>
    ratings.reduce((s, r) => s + (Number(r[field]) || 0), 0) / totalRatings;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => { distribution[r.overallRating as keyof typeof distribution]++; });

  // Get return stats
  const returnCount = await prisma.returnRequest.count({ where: { companyId } });
  const deliveredCount = await prisma.package.count({ where: { companyId, status: 'DELIVERED' } });
  const returnRate = deliveredCount > 0 ? (returnCount / deliveredCount) * 100 : 0;

  // Delivery speed
  const deliveredPkgs = await prisma.package.findMany({
    where: { companyId, status: 'DELIVERED', receivedAt: { not: null }, deliveredAt: { not: null } },
    select: { receivedAt: true, deliveredAt: true },
    take: 500,
    orderBy: { deliveredAt: 'desc' },
  });
  let avgDeliveryDays = null;
  if (deliveredPkgs.length > 0) {
    const totalDays = deliveredPkgs.reduce((sum, p) => {
      const days = (p.deliveredAt!.getTime() - p.receivedAt!.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgDeliveryDays = totalDays / deliveredPkgs.length;
  }

  // Damage rate
  const damageReturns = await prisma.returnRequest.count({
    where: {
      companyId,
      returnType: { in: ['DAMAGED_IN_TRANSIT', 'DAMAGED_AT_UB', 'DAMAGED_AT_ERLIAN'] },
    },
  });
  const damageRate = deliveredCount > 0 ? (damageReturns / deliveredCount) * 100 : 0;

  // Calculate rank score
  const settings = await prisma.platformSettings.findFirst();
  const w = {
    overall: Number(settings?.ratingWeightOverall || 0.40),
    returns: Number(settings?.ratingWeightReturns || 0.25),
    speed: Number(settings?.ratingWeightSpeed || 0.15),
    resolution: Number(settings?.ratingWeightResolution || 0.10),
    safety: Number(settings?.ratingWeightSafety || 0.10),
  };

  const averageRating = avg('overallRating');
  const ratingScore = (averageRating / 5) * 100 * w.overall;
  const returnScore = Math.max(0, (1 - returnRate / 10)) * 100 * w.returns;
  const speedScore = avgDeliveryDays
    ? Math.max(0, (1 - (avgDeliveryDays - 5) / 15)) * 100 * w.speed
    : 50 * w.speed;
  const safetyScore = Math.max(0, (1 - damageRate / 5)) * 100 * w.safety;
  const resolutionScore = 50 * w.resolution; // TODO: calculate from actual resolution time

  const rankScore = Math.min(100, ratingScore + returnScore + speedScore + safetyScore + resolutionScore);

  await prisma.companyRatingsSummary.upsert({
    where: { companyId },
    create: {
      companyId,
      totalRatings,
      averageRating,
      avgSpeed: avg('speedRating'),
      avgSafety: avg('safetyRating'),
      avgService: avg('serviceRating'),
      avgPrice: avg('priceRating'),
      count5Star: distribution[5],
      count4Star: distribution[4],
      count3Star: distribution[3],
      count2Star: distribution[2],
      count1Star: distribution[1],
      totalReturns: returnCount,
      returnRate,
      totalDelivered: deliveredCount,
      avgDeliveryDays,
      damageRate,
      rankScore,
    },
    update: {
      totalRatings,
      averageRating,
      avgSpeed: avg('speedRating'),
      avgSafety: avg('safetyRating'),
      avgService: avg('serviceRating'),
      avgPrice: avg('priceRating'),
      count5Star: distribution[5],
      count4Star: distribution[4],
      count3Star: distribution[3],
      count2Star: distribution[2],
      count1Star: distribution[1],
      totalReturns: returnCount,
      returnRate,
      totalDelivered: deliveredCount,
      avgDeliveryDays,
      damageRate,
      rankScore,
      lastCalculatedAt: new Date(),
    },
  });

  // Update rank positions for all companies
  const allSummaries = await prisma.companyRatingsSummary.findMany({
    orderBy: { rankScore: 'desc' },
  });
  for (let i = 0; i < allSummaries.length; i++) {
    await prisma.companyRatingsSummary.update({
      where: { id: allSummaries[i].id },
      data: { rankPosition: i + 1 },
    });
  }
}

// ═══ Routes ═══

// POST /api/ratings
ratingsRouter.post('/', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const data = createRatingSchema.parse(req.body);
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { returnRequests: true },
    });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.customerId !== userId) throw new AppError('Эрх хүрэлцэхгүй', 403);
    if (order.status !== 'COMPLETED') throw new AppError('Захиалга дуусаагүй байна', 400);

    const existing = await prisma.rating.findUnique({ where: { orderId: data.orderId } });
    if (existing) throw new AppError('Аль хэдийн үнэлгээ өгсөн', 409);

    const rating = await prisma.rating.create({
      data: {
        companyId: order.companyId,
        customerId: userId,
        orderId: data.orderId,
        overallRating: data.overallRating,
        speedRating: data.speedRating,
        safetyRating: data.safetyRating,
        serviceRating: data.serviceRating,
        priceRating: data.priceRating,
        communicationRating: data.communicationRating,
        comment: data.comment,
        tags: data.tags,
        hadReturnRequest: order.returnRequests.length > 0,
      },
    });

    // Recalculate company rating
    await recalculateCompanyRating(order.companyId);

    res.status(201).json({
      success: true,
      message: 'Үнэлгээ амжилттай илгээгдлээ. Баярлалаа!',
      data: { rating },
    });
  } catch (e) { next(e); }
});

// POST /api/ratings/:id/respond - Company responds to rating
ratingsRouter.post('/:id/respond', authorize('CARGO_ADMIN'), async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response) throw new AppError('Хариулт оруулна уу', 400);

    const rating = await prisma.rating.findUnique({ where: { id: req.params.id as string } });
    if (!rating) throw new AppError('Үнэлгээ олдсонгүй', 404);
    if (rating.companyId !== req.user!.companyId) throw new AppError('Эрх хүрэлцэхгүй', 403);

    const updated = await prisma.rating.update({
      where: { id: req.params.id as string },
      data: { companyResponse: response, companyRespondedAt: new Date() },
    });

    res.json({ success: true, data: { rating: updated } });
  } catch (e) { next(e); }
});
