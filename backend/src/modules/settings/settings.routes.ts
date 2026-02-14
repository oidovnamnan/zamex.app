import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

// GET /api/settings/public - Get essential platform settings for all users
settingsRouter.get('/public', async (_req, res, next) => {
  try {
    const settings = await prisma.platformSettings.findFirst({
      select: {
        imongoliaEnabled: true,
        maintenanceMode: true,
        registrationOpen: true,
        qcServiceEnabled: true,
      }
    });

    const qcTiers = await (prisma as any).qcTier.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    res.json({ success: true, data: { settings, qcTiers } });
  } catch (e) { next(e); }
});

settingsRouter.use(authorize('SUPER_ADMIN'));

// GET /api/settings - Get all platform settings
settingsRouter.get('/', async (_req, res, next) => {
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      // Create default settings
      const hash = await bcrypt.hash('zamex_config_2025', 12);
      settings = await prisma.platformSettings.create({
        data: { configPasswordHash: hash },
      });
    }

    // Remove password hash from response
    const { configPasswordHash, ...safeSettings } = settings;
    res.json({ success: true, data: { settings: safeSettings } });
  } catch (e) { next(e); }
});

// PUT /api/settings - Update platform settings (requires config password)
settingsRouter.put('/', async (req, res, next) => {
  try {
    const { configPassword, ...updates } = req.body;

    if (!configPassword) {
      throw new AppError('Тохиргооны нууц үг шаардлагатай', 401);
    }

    const settings = await prisma.platformSettings.findFirst();
    if (!settings) throw new AppError('Тохиргоо олдсонгүй', 404);

    const isValid = await bcrypt.compare(configPassword, settings.configPasswordHash);
    if (!isValid) {
      throw new AppError('Тохиргооны нууц үг буруу', 401);
    }

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.configPasswordHash;
    delete updates.createdAt;

    // Log each change
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = (settings as any)[key];
      if (oldValue !== undefined && String(oldValue) !== String(value)) {
        await prisma.platformSettingsHistory.create({
          data: {
            changedBy: req.user!.userId,
            fieldName: key,
            oldValue: String(oldValue),
            newValue: String(value),
            ipAddress: req.ip,
          },
        });
      }
    }

    const updated = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        ...updates,
        lastModifiedBy: req.user!.userId,
        lastModifiedAt: new Date(),
      },
    });

    const { configPasswordHash, ...safeSettings } = updated;
    res.json({
      success: true,
      message: 'Тохиргоо амжилттай шинэчлэгдлээ',
      data: { settings: safeSettings },
    });
  } catch (e) { next(e); }
});

// PUT /api/settings/password - Change config password
settingsRouter.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Одоогийн болон шинэ нууц үг шаардлагатай', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('Нууц үг хамгийн багадаа 8 тэмдэгт', 400);
    }

    const settings = await prisma.platformSettings.findFirst();
    if (!settings) throw new AppError('Тохиргоо олдсонгүй', 404);

    const isValid = await bcrypt.compare(currentPassword, settings.configPasswordHash);
    if (!isValid) throw new AppError('Одоогийн нууц үг буруу', 401);

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.platformSettings.update({
      where: { id: settings.id },
      data: { configPasswordHash: newHash, lastModifiedBy: req.user!.userId, lastModifiedAt: new Date() },
    });

    await prisma.platformSettingsHistory.create({
      data: {
        changedBy: req.user!.userId,
        fieldName: 'configPasswordHash',
        oldValue: '[HIDDEN]',
        newValue: '[CHANGED]',
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Тохиргооны нууц үг амжилттай солигдлоо' });
  } catch (e) { next(e); }
});

// GET /api/settings/history - Get settings change history
settingsRouter.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const [history, total] = await Promise.all([
      prisma.platformSettingsHistory.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.platformSettingsHistory.count(),
    ]);

    res.json({ success: true, data: { history, total, page, limit } });
  } catch (e) { next(e); }
});

// GET /api/settings/dashboard - Super admin dashboard stats
settingsRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [
      totalCompanies,
      totalCustomers,
      totalOrders,
      totalPackages,
      activePackages,
      monthlyOrders,
      pendingReturns,
      unidentifiedCount,
    ] = await Promise.all([
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
      prisma.order.count(),
      prisma.package.count(),
      prisma.package.count({ where: { status: { notIn: ['DELIVERED', 'RETURNED'] } } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      prisma.returnRequest.count({ where: { status: { in: ['OPENED', 'UNDER_REVIEW'] } } }),
      prisma.unidentifiedPackage.count({ where: { status: 'STORED' } }),
    ]);

    // Monthly revenue (from paid invoices this month)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const revenueResult = await prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    });

    const feeResult = await prisma.platformFee.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { feeAmount: true },
    });

    res.json({
      success: true,
      data: {
        totalCompanies,
        totalCustomers,
        totalOrders,
        totalPackages,
        activePackages,
        monthlyOrders,
        pendingReturns,
        unidentifiedCount,
        monthlyRevenue: revenueResult._sum.totalAmount || 0,
        monthlyPlatformFees: feeResult._sum.feeAmount || 0,
      },
    });
  } catch (e) { next(e); }
});
// ═══ QC Tiers Management ═══

settingsRouter.get('/qc-tiers', authorize('SUPER_ADMIN'), async (_req, res, next) => {
  try {
    const tiers = await (prisma as any).qcTier.findMany({ orderBy: { price: 'asc' } });
    res.json({ success: true, data: { tiers } });
  } catch (e) { next(e); }
});

settingsRouter.post('/qc-tiers', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { name, description, price, isActive } = req.body;
    const settings = await prisma.platformSettings.findFirst();

    const tier = await (prisma as any).qcTier.create({
      data: {
        name,
        description,
        price,
        isActive: isActive !== undefined ? isActive : true,
        platformSettingsId: settings?.id
      }
    });
    res.json({ success: true, data: { tier } });
  } catch (e) { next(e); }
});

settingsRouter.patch('/qc-tiers/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tier = await (prisma as any).qcTier.update({
      where: { id },
      data: updates
    });
    res.json({ success: true, data: { tier } });
  } catch (e) { next(e); }
});

settingsRouter.delete('/qc-tiers/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await (prisma as any).qcTier.delete({ where: { id } });
    res.json({ success: true, message: 'Tier deleted' });
  } catch (e) { next(e); }
});
