import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const verificationRouter = Router();
verificationRouter.use(authenticate);

const regNumberRegex = /^[А-ЯӨҮа-яөүA-Za-z]{2}[0-9]{8}$/;

const verificationRequestSchema = z.object({
    entityType: z.enum(['COMPANY', 'USER']),
    isForeign: z.boolean().default(false),
    country: z.string().optional(),
    tradingName: z.string().min(2, 'Каргоны нэр шаардлагатай'),
    ownerName: z.string().optional(),
    officialName: z.string()
        .min(2, 'Овог нэр хэтэрхий богино байна'),
    registrationNumber: z.string()
        .min(5, 'Дугаар хэтэрхий богино байна'),
    officialAddress: z.string().min(5, 'Хаяг хэтэрхий богино байна'),
    identityProofUrl: z.string().min(1, 'Бичиг баримтын зураг шаардлагатай'),
    businessLicenseUrl: z.string().optional(),
    livePhotoUrl: z.string().min(1, 'Цээж зураг шаардлагатай'),
    verifiedVia: z.enum(['MANUAL', 'IMONGOLIA']).default('MANUAL'),
}).refine((data) => {
    if (!data.isForeign && data.entityType === 'USER' && data.verifiedVia === 'MANUAL') {
        return regNumberRegex.test(data.registrationNumber);
    }
    return true;
}, {
    message: 'Регистрийн дугаар буруу форматтай байна (Жишээ: АА00000000)',
    path: ['registrationNumber'],
});

// POST /api/verification/request - Submit a new verification request
verificationRouter.post('/request', async (req, res, next) => {
    console.log('Incoming Verification Request:', { body: req.body, user: req.user });
    try {
        const validated = verificationRequestSchema.parse(req.body);
        const entityId = validated.entityType === 'COMPANY' ? req.user!.companyId : req.user!.userId;

        console.log('Verification Request - Validated Data:', validated);
        console.log('Verification Request - Entity ID:', entityId);

        if (!entityId) {
            throw new AppError('Холбогдох байгууллага эсвэл хэрэглэгч олдсонгүй', 400);
        }

        // Check if there's already a pending request
        const existing = await prisma.verificationRequest.findFirst({
            where: { entityId, status: 'PENDING' }
        });

        if (existing) {
            throw new AppError('Төлөв хүлээгдэж буй хүсэлт аль хэдийн байна', 400);
        }

        // Verify entity exists
        if (validated.entityType === 'COMPANY') {
            const company = await prisma.company.findUnique({ where: { id: entityId } });
            if (!company) throw new AppError('Байгууллага олдсонгүй (Дахин нэвтэрнэ үү)', 404);
        } else {
            const user = await prisma.user.findUnique({ where: { id: entityId } });
            if (!user) throw new AppError('Хэрэглэгч олдсонгүй (Дахин нэвтэрнэ үү)', 404);
        }

        let request;
        try {
            console.log('Attempting to create verification request in DB...');
            request = await prisma.verificationRequest.create({
                data: {
                    ...validated,
                    entityId,
                    status: 'PENDING'
                }
            });
            console.log('Verification request created:', request.id);
        } catch (dbErr: any) {
            console.error('DB Error creating VerificationRequest:', dbErr);
            throw new AppError(`DB Error: ${dbErr.message}`, 500);
        }

        // Update entity status to PENDING
        try {
            console.log('Updating entity status to PENDING...');
            if (validated.entityType === 'COMPANY') {
                await prisma.company.update({
                    where: { id: entityId },
                    data: { verificationStatus: 'PENDING' }
                });
            } else {
                await prisma.user.update({
                    where: { id: entityId },
                    data: { verificationStatus: 'PENDING' }
                });
            }
            console.log('Entity status updated successfully');
        } catch (dbErr: any) {
            console.error('DB Error updating entity status:', dbErr);
            throw new AppError(`DB Error (Update): ${dbErr.message}`, 500);
        }

        res.status(201).json({ success: true, data: request });
    } catch (e: any) {
        console.error('Verification Request Error:', e);
        next(e);
    }
});

// GET /api/verification/status - Get current verification status
verificationRouter.get('/status', async (req, res, next) => {
    try {
        const userId = req.user!.userId;
        const companyId = req.user!.companyId;

        const [userRequest, companyRequest] = await Promise.all([
            prisma.verificationRequest.findFirst({
                where: { entityId: userId },
                orderBy: { createdAt: 'desc' }
            }),
            companyId ? prisma.verificationRequest.findFirst({
                where: { entityId: companyId },
                orderBy: { createdAt: 'desc' }
            }) : null
        ]);

        res.json({
            success: true,
            data: {
                user: userRequest,
                company: companyRequest
            }
        });
    } catch (e) { next(e); }
});

// ADMIN ONLY: GET /api/verification - List all verification requests
verificationRouter.get('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const { status, type } = req.query;
        const requests = await prisma.verificationRequest.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(type ? { entityType: type as any } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: requests });
    } catch (e) { next(e); }
});

// ADMIN ONLY: PATCH /api/verification/:id/review - Approve or reject
const verReviewSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

verificationRouter.patch('/:id/review', authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = verReviewSchema.parse(req.body);

        const request = await prisma.verificationRequest.findUnique({
            where: { id: id as string }
        });

        if (!request) throw new AppError('Request олдсонгүй', 404);

        const updated = await prisma.verificationRequest.update({
            where: { id: id as string },
            data: {
                status,
                rejectionReason: rejectionReason || null,
                reviewerId: req.user!.userId,
                reviewedAt: new Date()
            }
        });

        // Update business entity
        const isApproved = status === 'APPROVED';
        if (request.entityType === 'COMPANY') {
            await prisma.company.update({
                where: { id: request.entityId },
                data: {
                    isVerified: isApproved,
                    verificationStatus: status
                }
            });
        } else if (request.entityType === 'USER') {
            await prisma.user.update({
                where: { id: request.entityId },
                data: {
                    isVerified: isApproved,
                    verificationStatus: status
                }
            });
        } else if (request.entityType === 'VEHICLE') {
            await prisma.vehicle.update({
                where: { id: request.entityId },
                data: {
                    isVerified: isApproved,
                    status: status
                }
            });
        }

        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});
