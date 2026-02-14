import { Router } from 'express';
import { authenticateApiKey, checkScope } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const externalRouter = Router();
externalRouter.use(authenticateApiKey);

const createPackageSchema = z.object({
    trackingNumber: z.string().min(1),
    customerCode: z.string().min(1),
    description: z.string().optional(),
    weight: z.number().optional(),
    targetCompanyId: z.string().optional(), // Required only for STORE type callers
});

const updatePackageSchema = z.object({
    description: z.string().optional(),
    weight: z.number().optional(),
});

/**
 * @api {post} /api/v1/external/packages Create Package
 * @apiDescription Allows external stores to pre-announce a package.
 */
externalRouter.post('/packages', checkScope('write:packages'), async (req, res, next) => {
    try {
        const data = createPackageSchema.parse(req.body);
        let companyId = req.user!.companyId!;
        let sourceStoreId: string | null = null;

        // If the caller is a STORE, they must specify which CARGO company they are sending to
        if ((req.user as any).companyType === 'STORE') {
            if (!data.targetCompanyId) throw new AppError('Store төрөлтэй хандалтад targetCompanyId шаардлагатай', 400);
            sourceStoreId = companyId;
            companyId = data.targetCompanyId;
        }

        const customer = await prisma.customerCompany.findUnique({
            where: {
                companyId_customerCode: {
                    companyId,
                    customerCode: data.customerCode
                }
            },
            include: { user: true }
        });

        if (!customer) throw new AppError('Буруу хэрэглэгчийн код эсвэл хэрэглэгч бүртгэлгүй байна', 400);

        const existing = await prisma.package.findFirst({
            where: { companyId, trackingNumber: data.trackingNumber }
        });

        if (existing) throw new AppError('Ачааны бүртгэл аль хэдийн үүссэн байна', 409);

        const pkg = await prisma.package.create({
            data: {
                companyId,
                sourceStoreId,
                customerId: customer.userId,
                trackingNumber: data.trackingNumber,
                description: data.description || 'External API Order',
                status: 'RECEIVED_ORIGIN',
                weightKg: data.weight || 0,
                registeredById: req.user!.userId.startsWith('API_') ? null : req.user!.userId,
            } as any
        });

        res.status(201).json({
            success: true,
            message: 'Ачаа амжилттай бүртгэгдлээ',
            data: { packageId: pkg.id, trackingNumber: pkg.trackingNumber, status: pkg.status }
        });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/packages List Packages
 */
externalRouter.get('/packages', checkScope('read:packages'), async (req, res, next) => {
    try {
        const companyId = req.user!.companyId!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const packages = await prisma.package.findMany({
            where: { companyId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                trackingNumber: true,
                status: true,
                description: true,
                weightKg: true,
                createdAt: true,
                updatedAt: true
            } as any
        });

        res.json({ success: true, data: { packages, page, limit } });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/packages/:tracking Track Package
 */
externalRouter.get('/packages/:tracking', checkScope('read:packages'), async (req, res, next) => {
    try {
        const { tracking } = req.params;
        const companyId = req.user!.companyId!;

        const pkg = await prisma.package.findFirst({
            where: { companyId, trackingNumber: tracking as string },
        }) as any;

        if (!pkg) throw new AppError('Ачаа олдсонгүй', 404);

        res.json({
            success: true,
            data: {
                trackingNumber: pkg.trackingNumber,
                status: pkg.status,
                description: pkg.description,
                weightKg: pkg.weightKg,
                updatedAt: pkg.updatedAt
            }
        });
    } catch (e) { next(e); }
});

/**
 * @api {patch} /api/v1/external/packages/:tracking Update Package
 */
externalRouter.patch('/packages/:tracking', checkScope('write:packages'), async (req, res, next) => {
    try {
        const tracking = req.params.tracking as string;
        const companyId = req.user!.companyId!;
        const data = updatePackageSchema.parse(req.body);

        const pkg = await prisma.package.findFirst({
            where: { companyId, trackingNumber: tracking },
        });

        if (!pkg) throw new AppError('Ачаа олдсонгүй', 404);
        if (pkg.status !== 'RECEIVED_ORIGIN') {
            throw new AppError('Ачаа аль хэдийн боловсруулагдсан тул засах боломжгүй', 400);
        }

        const updated = await prisma.package.update({
            where: { id: pkg.id },
            data: {
                description: data.description,
                weightKg: data.weight
            } as any
        });

        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});

/**
 * @api {delete} /api/v1/external/packages/:tracking Cancel Package
 */
externalRouter.delete('/packages/:tracking', checkScope('write:packages'), async (req, res, next) => {
    try {
        const tracking = req.params.tracking as string;
        const companyId = req.user!.companyId!;

        const pkg = await prisma.package.findFirst({
            where: { companyId, trackingNumber: tracking },
        });

        if (!pkg) throw new AppError('Ачаа олдсонгүй', 404);
        if (pkg.status !== 'RECEIVED_ORIGIN') {
            throw new AppError('Ачаа аль хэдийн боловсруулагдсан тул устгах боломжгүй', 400);
        }

        await prisma.package.delete({ where: { id: pkg.id } });

        res.json({ success: true, message: 'Ачааны бүртгэл цуцлагдлаа' });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/pricing Pricing Rates
 */
externalRouter.get('/pricing', checkScope('read:pricing'), async (req, res, next) => {
    try {
        let companyId = req.user!.companyId!;
        const targetId = req.query.companyId as string;

        if ((req.user as any).companyType === 'STORE' && targetId) {
            companyId = targetId;
        }

        const pricing = await prisma.pricingRule.findMany({
            where: { companyId, isActive: true },
            select: {
                id: true,
                name: true,
                pricePerKg: true,
                pricePerCbm: true,
                isDefault: true
            }
        });

        res.json({ success: true, data: { pricing } });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/warehouses Warehouses
 * @apiDescription Get cargo warehouse addresses for display in store.
 */
externalRouter.get('/warehouses', checkScope('read:info'), async (req, res, next) => {
    try {
        let companyId = req.user!.companyId!;
        const targetId = req.query.companyId as string;

        if ((req.user as any).companyType === 'STORE' && targetId) {
            companyId = targetId;
        }

        const warehouses = await prisma.warehouse.findMany({
            where: { companyId, isActive: true },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                type: true,
                city: true
            }
        });
        res.json({ success: true, data: { warehouses } });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/customers/:code Verify Customer
 */
externalRouter.get('/customers/:code', checkScope('read:info'), async (req, res, next) => {
    try {
        const { code } = req.params;
        let companyId = req.user!.companyId!;
        const targetId = req.query.companyId as string;

        if ((req.user as any).companyType === 'STORE' && targetId) {
            companyId = targetId;
        }

        const customer = await prisma.customerCompany.findUnique({
            where: {
                companyId_customerCode: {
                    companyId,
                    customerCode: code as string
                }
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, phone: true }
                }
            }
        });

        if (!customer) throw new AppError('Хэрэглэгч олдсонгүй', 404);

        res.json({
            success: true,
            data: {
                customerCode: customer.customerCode,
                firstName: customer.user.firstName,
                lastName: customer.user.lastName,
                phone: customer.user.phone,
                joinedAt: customer.joinedAt
            }
        });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/invoices/:tracking Invoice Status
 */
externalRouter.get('/invoices/:tracking', checkScope('read:packages'), async (req, res, next) => {
    try {
        const tracking = req.params.tracking as string;
        const companyId = req.user!.companyId!;

        const pkg = await prisma.package.findFirst({
            where: { companyId, trackingNumber: tracking },
            include: {
                invoiceItems: {
                    include: { invoice: true }
                }
            }
        });

        if (!pkg || pkg.invoiceItems.length === 0) throw new AppError('Нэхэмжлэх олдсонгүй', 404);

        const invoice = pkg.invoiceItems[0].invoice;

        res.json({
            success: true,
            data: {
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
                status: invoice.status,
                isPaid: invoice.status === 'PAID',
                createdAt: invoice.createdAt
            }
        });
    } catch (e) { next(e); }
});

/**
 * @api {get} /api/v1/external/discovery/cargo List Cargo Companies
 * @apiDescription Get a list of active cargo companies on the platform.
 */
externalRouter.get('/discovery/cargo', checkScope('read:info'), async (req, res, next) => {
    try {
        const companies = await (prisma as any).company.findMany({
            where: { type: { in: ['CARGO', 'BOTH'] }, isActive: true },
            select: {
                id: true,
                name: true,
                codePrefix: true,
                logoUrl: true,
                phone: true,
                description: true
            }
        });
        res.json({ success: true, data: { companies } });
    } catch (e) { next(e); }
});
