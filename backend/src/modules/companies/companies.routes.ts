import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const companiesRouter = Router();

// ═══ Routes ═══

// ═══ Staff & Role Management ═══

// PATCH /api/companies/:id/staff/:staffId - Update staff member
companiesRouter.patch('/:id/staff/:staffId', authenticate, async (req, res, next) => {
  try {
    const { id, staffId } = req.params;
    if (req.user!.role !== 'SUPER_ADMIN' && (req.user!.role !== 'CARGO_ADMIN' || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    const { role, roleTemplateId, isActive } = updateStaffSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: staffId as string, companyId: id as string },
      data: { role, isActive, roleTemplateId: roleTemplateId === '' ? null : roleTemplateId }
    });
    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// DELETE /api/companies/:id/staff/:staffId - Remove staff member from company
companiesRouter.delete('/:id/staff/:staffId', authenticate, async (req, res, next) => {
  try {
    const { id, staffId } = req.params;
    if (req.user!.role !== 'SUPER_ADMIN' && (req.user!.role !== 'CARGO_ADMIN' || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    if (req.user!.userId === staffId) {
      throw new AppError('Өөрийгөө хасах боломжгүй', 400);
    }
    await prisma.user.update({
      where: { id: staffId as string, companyId: id as string },
      data: { companyId: null, role: 'CUSTOMER', roleTemplateId: null }
    });
    res.json({ success: true, message: 'Ажилтан амжилттай хасагдлаа' });
  } catch (e) { next(e); }
});

// ═══ Validation ═══
const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  slug: z.string().min(1).max(50),
  logoUrl: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  description: z.string().max(1000).optional(),
  codePrefix: z.string().length(4).toUpperCase(),
  cargoType: z.enum(['ERLIAN_UB', 'ERLIAN_ONLY', 'UB_ONLY']).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specializationIds: z.array(z.string()).optional(),
});

const updateCompanySchema = createCompanySchema.partial();

// ═══ Routes ═══

const roleTemplateSchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()),
});

const addStaffSchema = z.object({
  phone: z.string().min(8).max(15),
  firstName: z.string().min(1),
  role: z.enum(['STAFF_ERLIAN', 'STAFF_MONGOLIA', 'DRIVER', 'CARGO_ADMIN']),
  roleTemplateId: z.string().optional(),
  password: z.string().min(6),
});

const updateStaffSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  roleTemplateId: z.string().uuid().nullable().or(z.literal('')).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/companies/:id/roles - List role templates
companiesRouter.get('/:id/roles', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const roles = await prisma.roleTemplate.findMany({
      where: { companyId: id },
      include: { _count: { select: { users: true } } }
    });

    res.json({ success: true, data: { roles } });
  } catch (e) { next(e); }
});

// POST /api/companies/:id/roles - Create role template
companiesRouter.post('/:id/roles', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'CARGO_ADMIN') {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    if (req.user!.role === 'CARGO_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Өөрийн компани дээр л эрх үүсгэх боломжтой', 403);
    }

    const { name, permissions } = roleTemplateSchema.parse(req.body);

    const existing = await prisma.roleTemplate.findUnique({
      where: { companyId_name: { companyId: id, name } }
    });
    if (existing) throw new AppError('Ийм нэртэй албан тушаал бүртгэгдсэн байна', 409);

    const role = await prisma.roleTemplate.create({
      data: { companyId: id, name, permissions }
    });

    res.status(201).json({ success: true, data: { role } });
  } catch (e) { next(e); }
});

// PATCH /api/companies/:id/roles/:roleId - Update role template
companiesRouter.patch('/:id/roles/:roleId', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const roleId = req.params.roleId as string;
    if (req.user!.role !== 'SUPER_ADMIN' && (req.user!.role !== 'CARGO_ADMIN' || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const data = roleTemplateSchema.partial().parse(req.body);

    const role = await prisma.roleTemplate.update({
      where: { id: roleId, companyId: id },
      data
    });

    res.json({ success: true, data: { role } });
  } catch (e) { next(e); }
});

// GET /api/companies/:id/staff - List company staff
companiesRouter.get('/:id/staff', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const staff = await prisma.user.findMany({
      where: { companyId: id },
      select: {
        id: true, phone: true, firstName: true, lastName: true,
        role: true, roleTemplate: true, isActive: true, lastLogin: true
      }
    });

    res.json({ success: true, data: { staff } });
  } catch (e) { next(e); }
});

// POST /api/companies/:id/staff - Add/Invite staff member
companiesRouter.post('/:id/staff', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && (req.user!.role !== 'CARGO_ADMIN' || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const data = addStaffSchema.parse(req.body);

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { phone: data.phone } });

    if (user) {
      if (user.companyId) throw new AppError('Энэ хэрэглэгч өөр компанид харьяалагдаж байна', 409);

      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          companyId: id,
          role: data.role,
          roleTemplateId: data.roleTemplateId as string | undefined,
          isActive: true
        }
      });
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(data.password, 12);
      user = await prisma.user.create({
        data: {
          phone: data.phone,
          firstName: data.firstName,
          password: hashedPassword,
          role: data.role,
          companyId: id,
          roleTemplateId: data.roleTemplateId as string | undefined,
          otpVerified: true, // Manual add bypasses OTP
        }
      });
    }

    res.status(201).json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

// GET /api/companies - Public: карго жагсаалт (рейтингээр эрэмбэлсэн)
companiesRouter.get('/', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, nameEn: true, slug: true, logoUrl: true,
        phone: true, description: true, codePrefix: true,
        specializations: true,
        ratingsSummary: {
          select: {
            averageRating: true, totalRatings: true, avgSpeed: true,
            avgSafety: true, avgService: true, avgPrice: true,
            totalDelivered: true, avgDeliveryDays: true, damageRate: true,
            returnRate: true, rankScore: true, rankPosition: true,
          },
        },
        pricingRules: {
          where: { isDefault: true, isActive: true },
          select: { pricePerKg: true },
          take: 1,
        },
      },
      orderBy: { ratingsSummary: { rankScore: 'desc' } },
    });

    res.json({ success: true, data: { companies } });
  } catch (e) { next(e); }
});

// POST /api/companies - Super Admin create
companiesRouter.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const data = createCompanySchema.parse(req.body);

    // Check if slug or prefix exists
    const existing = await prisma.company.findFirst({
      where: { OR: [{ slug: data.slug }, { codePrefix: data.codePrefix }] }
    });
    if (existing) throw new AppError('Slug эсвэл код префикс давхцаж байна', 409);

    const { specializationIds, ...rest } = data;

    const company = await prisma.company.create({
      data: {
        ...rest,
        workflowSettings: { create: {} }, // Default settings
        specializations: specializationIds ? {
          connect: specializationIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    res.status(201).json({ success: true, data: { company } });
  } catch (e) { next(e); }
});

// GET /api/companies/:id - Specific company details
companiesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        ratingsSummary: true,
        specializations: true,
        pricingRules: { where: { isActive: true } },
        warehouses: { where: { isActive: true } }
      }
    });
    if (!company) throw new AppError('Компани олдсонгүй', 404);
    res.json({ success: true, data: { company } });
  } catch (e) { next(e); }
});

// PATCH /api/companies/:id - Super Admin or Company Admin
companiesRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    // Check perm: SUPER_ADMIN or CARGO_ADMIN of this company
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const data = updateCompanySchema.parse(req.body);
    const { specializationIds, ...rest } = data;

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...rest,
        specializations: specializationIds ? {
          set: specializationIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    res.json({ success: true, data: { company } });
  } catch (e) { next(e); }
});

// DELETE /api/companies/:id - Super Admin only
companiesRouter.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await prisma.company.update({
      where: { id: req.params.id as string },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Компани идэвхгүй боллоо' });
  } catch (e) { next(e); }
});

// GET /api/companies/:id/customers - Customers list
companiesRouter.get('/:id/customers', authenticate, authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { customerCode: { contains: search } },
        { user: { phone: { contains: search } } },
        { user: { firstName: { contains: search } } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customerCompany.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.customerCompany.count({ where }),
    ]);

    res.json({ success: true, data: { customers, total, page, limit } });
  } catch (e) { next(e); }
});

// POST /api/companies/:companyId/join - Customer joins a cargo company
companiesRouter.post('/:companyId/join', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const companyId = req.params.companyId as string;
    const userId = req.user!.userId;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company || !company.isActive) throw new AppError('Карго компани олдсонгүй', 404);

    // Check if already joined
    const existing = await prisma.customerCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (existing) throw new AppError('Энэ каргод аль хэдийн бүртгүүлсэн', 409);

    // Generate customer code
    const lastCustomer = await prisma.customerCompany.findFirst({
      where: { companyId },
      orderBy: { joinedAt: 'desc' },
    });
    let nextCode = 1001;
    if (lastCustomer) {
      const lastNum = parseInt(lastCustomer.customerCode.split('-')[1] || '1000');
      nextCode = lastNum + 1;
    }
    const customerCode = `${company.codePrefix}-${nextCode}`;

    const isPrimary = !(await prisma.customerCompany.findFirst({ where: { userId } }));

    const customerCompany = await prisma.customerCompany.create({
      data: { userId, companyId, customerCode, isPrimary },
      include: {
        company: { select: { id: true, name: true, codePrefix: true, logoUrl: true } },
      },
    }) as any;

    res.status(201).json({
      success: true,
      message: `${company.name} каргод амжилттай бүртгүүллээ`,
      data: { customerCode, company: (customerCompany as any).company },
    });
  } catch (e) { next(e); }
});

// GET /api/companies/:companyId/ratings - Company ratings
companiesRouter.get('/:companyId/ratings', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [ratings, summary] = await Promise.all([
      prisma.rating.findMany({
        where: { companyId, isVisible: true },
        select: {
          id: true, overallRating: true, speedRating: true, safetyRating: true,
          serviceRating: true, comment: true, tags: true,
          companyResponse: true, companyRespondedAt: true,
          hadReturnRequest: true, createdAt: true,
          customer: { select: { firstName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyRatingsSummary.findUnique({ where: { companyId } }),
    ]);

    res.json({ success: true, data: { ratings, summary, page, limit } });
  } catch (e) { next(e); }
});

// ═══ Payment Account Management ═══

const paymentAccountSchema = z.object({
  type: z.enum(['BANK_MN', 'WECHAT', 'ALIPAY', 'BANK_CN', 'OTHER']),
  providerName: z.string().min(1).optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  identifier: z.string().optional(),
  qrUrl: z.string().url().nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/companies/:id/payment-accounts
companiesRouter.get('/:id/payment-accounts', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    const accounts = await prisma.companyPaymentAccount.findMany({
      where: { companyId: id as string },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ success: true, data: { accounts } });
  } catch (e) { next(e); }
});

// POST /api/companies/:id/payment-accounts

companiesRouter.post('/:id/payment-accounts', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (req.user!.role !== 'SUPER_ADMIN' && ((req.user!.role !== 'CARGO_ADMIN' && req.user!.role !== 'TRANSPORT_ADMIN') || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    const data = paymentAccountSchema.parse(req.body);

    if (req.user!.role === 'SUPER_ADMIN') {
      if (data.isDefault) {
        await prisma.companyPaymentAccount.updateMany({
          where: { companyId: id, isDefault: true },
          data: { isDefault: false }
        });
      }
      const account = await prisma.companyPaymentAccount.create({
        data: { ...data, companyId: id }
      });
      return res.status(201).json({ success: true, data: { account } });
    }

    // CARGO_ADMIN: Create request
    const request = await prisma.financialChangeRequest.create({
      data: {
        companyId: id,
        changeType: 'CREATE',
        requestedData: data,
        requesterId: req.user!.userId,
        status: 'PENDING'
      }
    });

    res.status(202).json({
      success: true,
      message: 'Данс нэмэх хүсэлт иллгээгдлээ. Супер админ баталгаажуулсны дараа идэвхжнэ.',
      data: { requestId: request.id }
    });
  } catch (e) { next(e); }
});

// PATCH /api/companies/:id/payment-accounts/:accountId
companiesRouter.patch('/:id/payment-accounts/:accountId', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const accountId = req.params.accountId as string;

    if (req.user!.role !== 'SUPER_ADMIN' && ((req.user!.role !== 'CARGO_ADMIN' && req.user!.role !== 'TRANSPORT_ADMIN') || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }
    const data = paymentAccountSchema.partial().parse(req.body);

    if (req.user!.role === 'SUPER_ADMIN') {
      if (data.isDefault) {
        await prisma.companyPaymentAccount.updateMany({
          where: { companyId: id, isDefault: true },
          data: { isDefault: false }
        });
      }
      const account = await prisma.companyPaymentAccount.update({
        where: { id: accountId, companyId: id },
        data
      });
      return res.json({ success: true, data: { account } });
    }

    // CARGO_ADMIN: Create update request
    const request = await prisma.financialChangeRequest.create({
      data: {
        companyId: id,
        entityId: accountId,
        changeType: 'UPDATE',
        requestedData: data,
        requesterId: req.user!.userId,
        status: 'PENDING'
      }
    });

    res.status(202).json({
      success: true,
      message: 'Өөрчлөх хүсэлт илгээгдлээ. Супер админ баталгаажуулсны дараа хэрэгжинэ.',
      data: { requestId: request.id }
    });
  } catch (e) { next(e); }
});

// DELETE /api/companies/:id/payment-accounts/:accountId
companiesRouter.delete('/:id/payment-accounts/:accountId', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const accountId = req.params.accountId as string;

    if (req.user!.role !== 'SUPER_ADMIN' && ((req.user!.role !== 'CARGO_ADMIN' && req.user!.role !== 'TRANSPORT_ADMIN') || req.user!.companyId !== id)) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    if (req.user!.role === 'SUPER_ADMIN') {
      await prisma.companyPaymentAccount.delete({
        where: { id: accountId, companyId: id }
      });
      return res.json({ success: true, message: 'Данс устгагдлаа' });
    }

    // CARGO_ADMIN: Create delete request
    const request = await prisma.financialChangeRequest.create({
      data: {
        companyId: id,
        entityId: accountId,
        changeType: 'DELETE',
        requestedData: {},
        requesterId: req.user!.userId,
        status: 'PENDING'
      }
    });

    res.status(202).json({
      success: true,
      message: 'Устгах хүсэлт илгээгдлээ. Супер админ баталгаажуулсны дараа устгагдана.',
      data: { requestId: request.id }
    });
  } catch (e) { next(e); }
});

// ═══ Financial Change Request Review (Super Admin) ═══

// GET /api/financial-requests - List all pending requests
companiesRouter.get('/admin/financial-requests', authenticate, async (req, res, next) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') throw new AppError('Эрх хүрэлцэхгүй', 403);
    const { status = 'PENDING' } = req.query;

    const requests = await prisma.financialChangeRequest.findMany({
      where: { status: status as any },
      include: {
        company: { select: { name: true, codePrefix: true } },
        requester: { select: { firstName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { requests } });
  } catch (e) { next(e); }
});

// PATCH /api/financial-requests/:id/review - Approve or Reject
companiesRouter.patch('/admin/financial-requests/:id/review', authenticate, async (req, res, next) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') throw new AppError('Эрх хүрэлцэхгүй', 403);
    const { id } = req.params;
    const { status, rejectionReason } = z.object({
      status: z.enum(['APPROVED', 'REJECTED']),
      rejectionReason: z.string().optional()
    }).parse(req.body);

    const request = await prisma.financialChangeRequest.findUnique({
      // @ts-ignore
      where: { id: id as string },
      include: { company: true }
    });

    if (!request || request.status !== 'PENDING') {
      throw new AppError('Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн байна', 400);
    }

    if (status === 'REJECTED') {
      await prisma.financialChangeRequest.update({
        // @ts-ignore
        where: { id: id as string },
        data: {
          status: 'REJECTED',
          rejectionReason,
          reviewerId: req.user!.userId,
          reviewedAt: new Date()
        }
      });
      return res.json({ success: true, message: 'Хүсэлт цуцлагдлаа' });
    }

    // status === 'APPROVED' - Apply the change
    await prisma.$transaction(async (tx) => {
      const data = request.requestedData as any;

      if (request.changeType === 'CREATE') {
        if (data.isDefault) {
          await tx.companyPaymentAccount.updateMany({
            where: { companyId: request.companyId, isDefault: true },
            data: { isDefault: false }
          });
        }
        await tx.companyPaymentAccount.create({
          data: { ...data, companyId: request.companyId }
        });
      }
      else if (request.changeType === 'UPDATE' && request.entityId) {
        if (data.isDefault) {
          await tx.companyPaymentAccount.updateMany({
            where: { companyId: request.companyId, isDefault: true },
            data: { isDefault: false }
          });
        }
        await tx.companyPaymentAccount.update({
          where: { id: request.entityId },
          data: { ...data }
        });
      }
      else if (request.changeType === 'DELETE' && request.entityId) {
        await tx.companyPaymentAccount.delete({
          where: { id: request.entityId }
        });
      }

      await tx.financialChangeRequest.update({
        // @ts-ignore
        where: { id: id as string },
        data: {
          status: 'APPROVED',
          reviewerId: req.user!.userId,
          reviewedAt: new Date()
        }
      });
    });

    res.json({ success: true, message: 'Хүсэлт батлагдаж, өөрчлөлт орлоо' });
  } catch (e) { next(e); }
});

// ═══ Penalty System (Strikes & Suspension) ═══

// POST /api/companies/:id/penalties - Add a strike/penalty (Super Admin Only)
companiesRouter.post('/:id/penalties', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new AppError('Компани олдсонгүй', 404);

    await prisma.$transaction(async (tx) => {
      // 1. Create Penalty Record
      // @ts-ignore
      await tx.penalty.create({
        data: {
          companyId: id,
          reason,
          issuedBy: req.user!.userId,
        }
      });

      // 2. Increment Strike Count
      const updatedCompany = await tx.company.update({
        where: { id: id as string },
        // @ts-ignore
        data: { strikeCount: { increment: 1 } }
      });

      // 3. Check for Suspension Threshold (3 Strikes)
      if (updatedCompany.strikeCount >= 3 && updatedCompany.status !== 'SUSPENDED') {
        await tx.company.update({
          where: { id: id as string }, // Ensure id is string
          // @ts-ignore
          data: {
            status: 'SUSPENDED',
            isActive: false // Immediately stop operations
          }
        });
        // TODO: Notify Company Admins about suspension
      }
    });

    res.status(201).json({ success: true, message: 'Зөрчил бүртгэгдэж, сануулга өглөө. 3 дахь сануулгаас эрх түдгэлзэнэ.' });
  } catch (e) { next(e); }
});

// GET /api/companies/:id/penalties - List penalties
companiesRouter.get('/:id/penalties', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    // Only Super Admin or the Company's own admins can view penalties
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    const penalties = await prisma.penalty.findMany({
      where: { companyId: id as string },
      include: { issuer: { select: { firstName: true, email: true } } },
      orderBy: { issuedAt: 'desc' }
    });

    res.json({ success: true, data: { penalties } });
  } catch (e) { next(e); }
});

// DELETE /api/companies/:id/penalties/:penaltyId - Resolve a penalty (Super Admin Only)
companiesRouter.delete('/:id/penalties/:penaltyId', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const penaltyId = req.params.penaltyId as string;

    const company = await prisma.company.findUnique({ where: { id: id as string } });
    if (!company) throw new AppError('Компани олдсонгүй', 404);

    // @ts-ignore
    const penalty = await prisma.penalty.findFirst({ where: { id: penaltyId, companyId: id as string } });
    if (!penalty) throw new AppError('Зөрчил олдсонгүй', 404);

    await prisma.$transaction(async (tx) => {
      // @ts-ignore
      await tx.penalty.update({
        where: { id: penaltyId },
        data: {
          resolvedAt: new Date(),
          isActive: false
        }
      });

      // Decrement strike count only if the penalty was active
      if (penalty.isActive && (company as any).strikeCount > 0) {
        await tx.company.update({
          where: { id: id as string },
          // @ts-ignore
          data: { strikeCount: { decrement: 1 } }
        });
        // Note: Auto-unsuspension is not implemented here for safety. Manual review needed.
      }
    });

    res.json({ success: true, message: 'Зөрчил шийдвэрлэгдлээ' });
  } catch (e) { next(e); }
});
