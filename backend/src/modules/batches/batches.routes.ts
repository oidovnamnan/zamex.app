import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';
import crypto from 'crypto';
import { sendNotification } from '../notifications/notifications.routes';

export const batchesRouter = Router();
batchesRouter.use(authenticate);
batchesRouter.use(authorize('STAFF_ERLIAN', 'STAFF_MONGOLIA', 'DRIVER', 'CARGO_ADMIN', 'SUPER_ADMIN'));

// POST /api/batches - Create new batch
batchesRouter.post('/', async (req, res, next) => {
  try {
    const { companyId, carrierId, vehiclePlate, vehicleModel, vehicleType, driverId, originId, destinationId } = req.body;
    if (!companyId) throw new AppError('companyId шаардлагатай', 400);

    // Check if company is verified
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company?.isVerified) {
      throw new AppError('Байгууллага баталгаажаагүй байна. Үйл ажиллагаа явуулахын тулд баталгаажуулалт хийлгэнэ үү.', 403);
    }

    const count = await prisma.batch.count({ where: { companyId } });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const batchCode = `B-${today}-${String(count + 1).padStart(3, '0')}`;

    const batch = await prisma.batch.create({
      data: {
        companyId,
        carrierId: carrierId || companyId, // Default to same company if not specified
        batchCode,
        vehiclePlate,
        vehicleModel,
        vehicleType,
        driverId,
        originId,
        destinationId,
        serviceType: req.body.serviceType || 'STANDARD',
        manifestToken: crypto.randomBytes(32).toString('hex')
      },
    });

    res.status(201).json({ success: true, data: { batch } });
  } catch (e) { next(e); }
});

// POST /api/batches/:id/packages - Add packages to batch
batchesRouter.post('/:id/packages', async (req, res, next) => {
  try {
    const { packageIds } = req.body;
    if (!Array.isArray(packageIds) || !packageIds.length) {
      throw new AppError('packageIds жагсаалт шаардлагатай', 400);
    }

    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) throw new AppError('Batch олдсонгүй', 404);
    if (batch.status !== 'OPEN') throw new AppError('Batch хаагдсан байна', 400);

    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds }, batchId: null },
      include: {
        order: { select: { isHold: true } as any },
        customer: { select: { isConsolidationHold: true } as any },
      } as any,
    }) as any[];

    if (packages.length !== packageIds.length) {
      throw new AppError('Зарим бараа олдсонгүй эсвэл аль хэдийн batch-д орсон', 400);
    }

    // Check for holds
    const heldPackages = packages.filter(p => p.order?.isHold || p.customer?.isConsolidationHold);
    if (heldPackages.length > 0) {
      const codes = heldPackages.map(p => p.trackingNumber || p.id).join(', ');
      throw new AppError(`Дараах бараанууд хэрэглэгчийн хүсэлтээр хүлээгдэж байна (Hold): ${codes}`, 400);
    }

    await prisma.package.updateMany({
      where: { id: { in: packageIds } },
      data: { batchId: batch.id, status: 'BATCHED' },
    });

    const totalWeight = packages.reduce((sum, p) => sum + Number(p.weightKg || 0), 0);

    const updated = await prisma.batch.update({
      where: { id: batch.id },
      data: {
        totalPackages: { increment: packages.length },
        totalWeight: { increment: totalWeight },
      },
    });

    res.json({
      success: true,
      message: `${packages.length} бараа нэмэгдлээ`,
      data: { batch: updated },
    });
  } catch (e) { next(e); }
});

// PATCH /api/batches/:id/close - Close batch (no more packages)
batchesRouter.patch('/:id/close', async (req, res, next) => {
  try {
    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) throw new AppError('Batch олдсонгүй', 404);
    if (batch.status !== 'OPEN') throw new AppError('Batch аль хэдийн хаагдсан', 400);
    if (batch.totalPackages === 0) throw new AppError('Batch хоосон байна', 400);

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });

    res.json({ success: true, data: { batch: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/batches/:id/depart - Batch departs
batchesRouter.patch('/:id/depart', async (req, res, next) => {
  try {
    const { driverId, carrierId, vehicleInfo, vehiclePlate, vehicleModel, vehicleType } = req.body;

    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) throw new AppError('Batch олдсонгүй', 404);
    if (!['CLOSED', 'LOADING'].includes(batch.status)) {
      throw new AppError('Batch хаагдсан байх ёстой', 400);
    }

    // If driver is provided, try to find their company if carrierId is missing
    let finalCarrierId = carrierId || batch.carrierId;
    if (driverId && !finalCarrierId) {
      const driver = await prisma.user.findUnique({ where: { id: driverId } });
      if (driver?.companyId) finalCarrierId = driver.companyId;
    }

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: {
        status: 'DEPARTED',
        driverId: driverId || batch.driverId,
        carrierId: finalCarrierId,
        vehiclePlate: vehiclePlate || batch.vehiclePlate,
        vehicleModel: vehicleModel || batch.vehicleModel,
        vehicleType: vehicleType || batch.vehicleType,
        departedAt: new Date(),
        manifestToken: (batch as any).manifestToken || crypto.randomBytes(32).toString('hex')
      },
    });

    // Update all packages in batch
    await prisma.package.updateMany({
      where: { batchId: batch.id },
      data: { status: 'DEPARTED', departedAt: new Date() },
    });

    res.json({ success: true, data: { batch: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/batches/:id/arrive - Batch arrives at UB
batchesRouter.patch('/:id/arrive', async (req, res, next) => {
  try {
    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) throw new AppError('Batch олдсонгүй', 404);

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: { status: 'ARRIVED', arrivedAt: new Date() },
      include: { destination: true }
    });

    await prisma.package.updateMany({
      where: { batchId: batch.id },
      data: {
        status: 'ARRIVED_HUB',
        arrivedAt: new Date(),
        warehouseId: batch.destinationId // Update current location
      },
    });

    // Notify all customers about arrival
    const packages = await prisma.package.findMany({
      where: { batchId: batch.id },
      select: { customerId: true, trackingNumber: true }
    });

    const destName = (updated as any).destination?.name || 'Дараагийн агуулах';
    const destCity = (updated as any).destination?.city || '';

    for (const p of packages) {
      if (p.customerId) {
        await sendNotification(
          p.customerId,
          'STATUS_UPDATE',
          `Ачаа ${destCity}-д ирлээ`,
          `Таны ${p.trackingNumber} дугаартай ачаа ${destName} агуулахад ирлээ. Төлөв: ${destCity}`
        );
      }
    }

    res.json({ success: true, data: { batch: updated } });
  } catch (e) { next(e); }
});

// POST /api/batches/:id/gps - Record GPS location
batchesRouter.post('/:id/gps', async (req, res, next) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    if (!latitude || !longitude) throw new AppError('Координат шаардлагатай', 400);

    const gps = await prisma.gpsTracking.create({
      data: { batchId: req.params.id, latitude, longitude, speed, heading },
    });

    res.json({ success: true, data: { gps } });
  } catch (e) { next(e); }
});

// GET /api/batches/:id/gps - Get GPS history
batchesRouter.get('/:id/gps', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const points = await prisma.gpsTracking.findMany({
      where: { batchId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, data: { points } });
  } catch (e) { next(e); }
});

// PATCH /api/batches/:id/status - Manual status update (Driver/Staff)
batchesRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
    if (!batch) throw new AppError('Batch олдсонгүй', 404);

    const updated = await prisma.batch.update({
      where: { id: req.params.id },
      data: { status: status as any },
    });

    // If status is AT_CUSTOMS, update all packages too
    if (status === 'AT_CUSTOMS') {
      await prisma.package.updateMany({
        where: { batchId: batch.id },
        data: { status: 'AT_CUSTOMS' },
      });

      // Notify customers
      const packages = await prisma.package.findMany({
        where: { batchId: batch.id },
        select: { customerId: true, trackingNumber: true }
      });

      for (const p of packages) {
        if (p.customerId) {
          await sendNotification(
            p.customerId,
            'STATUS_UPDATE',
            'Ачаа Гааль дээр ирлээ',
            `Таны ${p.trackingNumber} дугаартай ачаа Гаалийн хяналтын бүсэд ирлээ.`
          );
        }
      }
    }

    res.json({ success: true, data: { batch: updated } });
  } catch (e) { next(e); }
});

// GET /api/batches
batchesRouter.get('/', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId || (req.query.companyId as string);
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: any = {};
    if (req.user!.role === 'DRIVER') {
      where.driverId = req.user!.userId;
    } else if (companyId) {
      where.companyId = companyId;
    }
    if (status) where.status = status;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          _count: { select: { packages: true } },
          driver: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.batch.count({ where }),
    ]);

    res.json({ success: true, data: { batches, total, page, limit } });
  } catch (e) { next(e); }
});
