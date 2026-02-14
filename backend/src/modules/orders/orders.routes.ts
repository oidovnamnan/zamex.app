import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const ordersRouter = Router();
ordersRouter.use(authenticate);

// ═══ Helpers ═══

const ORDER_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateOrderId(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ORDER_CODE_CHARS.charAt(Math.floor(Math.random() * ORDER_CODE_CHARS.length));
  }
  return code;
}

function detectPlatform(url: string): string | null {
  if (!url) return null;
  if (url.includes('taobao.com') || url.includes('m.tb.cn')) return 'taobao';
  if (url.includes('1688.com')) return '1688';
  if (url.includes('pinduoduo.com') || url.includes('yangkeduo.com')) return 'pinduoduo';
  if (url.includes('jd.com')) return 'jd';
  if (url.includes('douyin.com')) return 'douyin';
  if (url.includes('tmall.com')) return 'tmall';
  return 'other';
}

// ═══ Validation ═══

const createOrderSchema = z.object({
  companyId: z.string().uuid(),
  productUrl: z.string().url().optional(),
  productTitle: z.string().max(500).optional(),
  productImages: z.array(z.string()).default([]),
  productPrice: z.number().positive().optional(),
  productPriceCurrency: z.string().length(3).default('CNY'),
  productQuantity: z.number().int().positive().default(1),
  productDescription: z.string().max(1000).optional(),
  trackingNumber: z.string().max(100).optional(),
  insurancePlanSlug: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  serviceType: z.enum(['STANDARD', 'FAST']).default('STANDARD').optional(),
});

// ═══ Routes ═══

// POST /api/orders
ordersRouter.post('/', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user!.userId;

    const cc = await prisma.customerCompany.findUnique({
      where: { userId_companyId: { userId, companyId: data.companyId } },
      include: { company: true },
    });
    if (!cc) throw new AppError('Энэ каргод бүртгүүлээгүй байна', 403);

    const warehouse = await prisma.warehouse.findFirst({
      where: { companyId: data.companyId, type: 'ORIGIN', isActive: true },
    });
    if (!warehouse) throw new AppError('Агуулах тохируулагдаагүй', 400);

    // Generate unique order code
    let orderCode = '';
    for (let i = 0; i < 20; i++) {
      const orderId = generateOrderId();
      const codeNum = cc.customerCode.replace(`${cc.company.codePrefix}-`, '');
      orderCode = `${cc.company.codePrefix}-${codeNum}-${orderId}`;
      const exists = await prisma.order.findUnique({ where: { orderCode } });
      if (!exists) break;
      if (i === 19) throw new AppError('Код үүсгэхэд алдаа гарлаа', 500);
    }

    const receiverName = `${warehouse.receiverName || warehouse.name} ${orderCode}`;
    const shippingAddress = {
      receiver_name: receiverName,
      phone: warehouse.phone,
      address: warehouse.address,
      city: warehouse.city,
      copy_all: `收件人: ${receiverName}\n手机: ${warehouse.phone}\n地址: ${warehouse.address}`,
    };

    const order = await prisma.order.create({
      data: {
        companyId: data.companyId,
        customerId: userId,
        orderCode,
        productUrl: data.productUrl,
        productPlatform: data.productUrl ? detectPlatform(data.productUrl) : null,
        productTitle: data.productTitle,
        productImages: data.productImages,
        productPrice: data.productPrice,
        productPriceCurrency: data.productPriceCurrency,
        productQuantity: data.productQuantity,
        productDescription: data.productDescription,
        trackingNumber: data.trackingNumber,
        insurancePlanSlug: data.insurancePlanSlug,
        serviceType: (data.serviceType as any) || 'STANDARD',
        shippingAddress,
        status: data.trackingNumber ? 'PRE_ANNOUNCED' : 'PENDING',
      },
    });

    // Create insurance record
    if (data.insurancePlanSlug && data.productPrice) {
      const settings = await prisma.platformSettings.findFirst();
      if (settings?.insuranceEnabled) {
        const planConfigs: Record<string, { rate: number; coverage: number; max: number }> = {
          BASIC: { rate: Number(settings.insuranceBasicRate), coverage: Number(settings.insuranceBasicCoverage), max: Number(settings.insuranceBasicMax) },
          STANDARD: { rate: Number(settings.insuranceStandardRate), coverage: Number(settings.insuranceStandardCoverage), max: Number(settings.insuranceStandardMax) },
          PREMIUM: { rate: Number(settings.insurancePremiumRate), coverage: Number(settings.insurancePremiumCoverage), max: Number(settings.insurancePremiumMax) },
        };
        const cfg = planConfigs[data.insurancePlanSlug];
        const exRate = await prisma.exchangeRate.findFirst({
          where: { fromCurrency: 'CNY', toCurrency: 'MNT' },
          orderBy: { effectiveAt: 'desc' },
        });
        const rate = exRate ? Number(exRate.rate) : 178;
        const valueMnt = data.productPrice * rate;
        const premium = Math.max(Math.round(valueMnt * cfg.rate), 500);
        const maxPayout = Math.min(Math.round(valueMnt * cfg.coverage), cfg.max);

        await prisma.packageInsurance.create({
          data: {
            orderId: order.id,
            planSlug: data.insurancePlanSlug,
            declaredValue: data.productPrice,
            declaredCurrency: data.productPriceCurrency,
            declaredValueMnt: valueMnt,
            premium,
            maxPayout,
            coverageRate: cfg.coverage,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Захиалга амжилттай үүслээ',
      data: { order: { id: order.id, orderCode, status: order.status, shippingAddress } },
    });
  } catch (e) { next(e); }
});

// GET /api/orders
ordersRouter.get('/', authorize('CUSTOMER', 'SUPER_ADMIN', 'CARGO_ADMIN'), async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const companyIdFromQuery = req.query.companyId as string;
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const where: any = {};

    // Role-based filtering
    if (role === 'CUSTOMER') {
      where.customerId = userId;
    } else if (role === 'CARGO_ADMIN') {
      where.companyId = req.user!.companyId;
    } else if (role === 'SUPER_ADMIN') {
      // Sees everything, can filter by companyId if provided
      if (companyIdFromQuery) where.companyId = companyIdFromQuery;
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { productTitle: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, logoUrl: true, codePrefix: true } },
          customer: { select: { id: true, firstName: true, phone: true } },
          package: {
            select: { id: true, status: true, weightKg: true, shippingCost: true, packagePhotos: true },
          },
          insurance: { select: { planSlug: true, premium: true, maxPayout: true, status: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: { orders, total, page, limit } });
  } catch (e) { next(e); }
});

// GET /api/orders/admin/qc-monitor - Super Admin: See all active QC requests
ordersRouter.get('/admin/qc-monitor', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where: any = { qcRequested: true };
    if (status) where.qcStatus = status;

    const orders = await (prisma as any).order.findMany({
      where,
      include: {
        customer: { select: { firstName: true, phone: true } },
        company: { select: { name: true } },
        qcTier: true,
        package: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Add priority/delay flagging
    const now = new Date();
    const processedOrders = orders.map((o: any) => {
      const isDelayed = o.qcStatus === 'PAID' && o.qcPaidAt && (now.getTime() - new Date(o.qcPaidAt).getTime() > 24 * 60 * 60 * 1000);
      return { ...o, isDelayed };
    });

    res.json({ success: true, data: { orders: processedOrders } });
  } catch (e) { next(e); }
});

// GET /api/orders/:id
ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, codePrefix: true, phone: true } },
        customer: { select: { id: true, firstName: true, phone: true } },
        package: {
          select: {
            id: true, status: true, weightKg: true, lengthCm: true, widthCm: true,
            heightCm: true, shippingCost: true, packagePhotos: true, labelPhotoUrl: true,
            shelfLocation: true, receivedAt: true, departedAt: true, arrivedAt: true, deliveredAt: true,
            category: { select: { id: true, name: true } },
            batch: { select: { id: true, batchCode: true, status: true } },
          },
        },
        insurance: true,
        returnRequests: { select: { id: true, returnCode: true, returnType: true, status: true, createdAt: true } },
      },
    });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);

    // Auth check
    if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.userId) {
      throw new AppError('Эрх хүрэлцэхгүй', 403);
    }

    res.json({ success: true, data: { order } });
  } catch (e) { next(e); }
});

// PATCH /api/orders/:id/tracking
ordersRouter.patch('/:id/tracking', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { trackingNumber } = req.body;
    if (!trackingNumber) throw new AppError('Tracking дугаар оруулна уу', 400);

    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.customerId !== req.user!.userId) throw new AppError('Эрх хүрэлцэхгүй', 403);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        status: order.status === 'PENDING' ? 'PRE_ANNOUNCED' : order.status,
      },
    });

    res.json({ success: true, data: { order: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/orders/:id/hold - Toggle hold status
ordersRouter.patch('/:id/hold', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { isHold } = req.body;
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: id as string } });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.customerId !== req.user!.userId) throw new AppError('Эрх хүрэлцэхгүй', 403);

    // If isHold is not provided in body, toggle the current state
    const newHoldStatus = isHold !== undefined ? !!isHold : !order.isHold;

    const updated = await prisma.order.update({
      where: { id: id as string },
      data: { isHold: newHoldStatus } as any,
    });

    res.json({ success: true, data: { order: updated } });
  } catch (e) { next(e); }
});

// PATCH /api/orders/:id/qc-request - Request QC inspection with tier selection
ordersRouter.patch('/:id/qc-request', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qcTierId } = req.body;

    if (!qcTierId) throw new AppError('QC багц сонгоно уу', 400);

    const order = await prisma.order.findUnique({ where: { id: id as string } });
    if (!order) throw new AppError('Захиалга олдсонгүй', 404);
    if (order.customerId !== req.user!.userId) throw new AppError('Эрх хүрэлцэхгүй', 403);

    const tier = await (prisma as any).qcTier.findUnique({ where: { id: qcTierId } });
    if (!tier) throw new AppError('Сонгосон QC багц олдсонгүй', 404);

    const updated = await (prisma.order as any).update({
      where: { id: id as string },
      data: {
        qcRequested: true,
        qcTierId: tier.id,
        qcServiceFee: tier.price,
        qcStatus: 'PENDING_PAYMENT'
      },
    });

    res.json({ success: true, data: { order: updated } });
  } catch (e) { next(e); }
});

// POST /api/orders/:id/qc-pay - Simulate QC payment (QPay)
ordersRouter.post('/:id/qc-pay', authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id: id as string } });
    if (!order || order.customerId !== req.user!.userId) throw new AppError('Unauthorized', 403);

    if ((order as any).qcStatus !== 'PENDING_PAYMENT') {
      throw new AppError('Төлбөр төлөх боломжгүй төлөв байна', 400);
    }

    // Simulate successful QPay payment
    const settings = await prisma.platformSettings.findFirst();
    const subtotal = (order as any).qcServiceFee || 0;

    // Calculate VAT if enabled
    let vatableAmount = subtotal;
    let vatAmount = 0;
    if (settings?.vatEnabled) {
      vatAmount = subtotal * (settings.vatRate || 0.10);
      vatableAmount = subtotal - vatAmount; // Assuming fee inclusive of VAT or calculating net
    }

    // Revenue Sharing (System vs Cargo)
    const platformShareRate = (settings as any)?.qcPlatformShareRate || 0.30;
    const platformFee = vatableAmount * platformShareRate;
    const cargoRevenue = vatableAmount - platformFee;

    const updated = await (prisma.order as any).update({
      where: { id },
      data: {
        qcStatus: 'PAID',
        qcPaidAt: new Date(),
        qcPaymentId: `QPAY-QC-${Date.now()}`,
        qcVatAmount: vatAmount,
        qcPlatformFee: platformFee,
        qcCargoRevenue: cargoRevenue
      }
    });

    res.json({ success: true, message: 'QC төлбөр амжилттай', data: { order: updated } });
  } catch (e) { next(e); }
});
