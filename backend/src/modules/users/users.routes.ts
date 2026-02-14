import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const usersRouter = Router();

usersRouter.use(authenticate);

// POST /api/users - Super Admin: Шинэ ажилтан/хэрэглэгч үүсгэх
usersRouter.post('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { phone, firstName, lastName, role, password, companyId } = req.body;

    // Check if user exists
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) throw new AppError('Утасны дугаар бүртгэлтэй байна', 400);

    const crypto = await import('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password || 'zamex123').digest('hex');

    const user = await prisma.user.create({
      data: {
        phone,
        firstName,
        lastName,
        role: role as any,
        password: hashedPassword,
        companyId,
        isActive: true
      }
    });

    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// GET /api/users - Super Admin: бүх хэрэглэгч
usersRouter.get('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLogin: true, createdAt: true,
          companyId: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page, limit } });
  } catch (e) { next(e); }
});

usersRouter.patch('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        role: role as any,
        isActive: isActive as boolean | undefined,
      },
    });
    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// PATCH /api/users/profile - Update own profile
usersRouter.patch('/profile', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, isConsolidationHold, language } = req.body;

    const user = await prisma.user.update({
      where: { id: userId as string },
      data: {
        firstName,
        lastName,
        isConsolidationHold: isConsolidationHold !== undefined ? !!isConsolidationHold : undefined,
        language: language as any,
      } as any,
    });

    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});
