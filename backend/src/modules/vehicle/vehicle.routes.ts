import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const vehicleRouter = Router();
vehicleRouter.use(authenticate);

const vehicleSchema = z.object({
    plateNumber: z.string().min(4),
    model: z.string().min(2),
    type: z.enum(['TRUCK', 'VAN', 'SEMIRAIL', 'TRAILER', 'OTHER']).default('TRUCK'),
    capacityWeight: z.number().optional(),
    capacityVolume: z.number().optional(),
    registrationCert: z.string().optional(),
    licensePhotoUrl: z.string().optional(),
    vehiclePhotoUrl: z.string().optional(),
    diagnosticPhotoUrl: z.string().optional(),
});

// POST /api/vehicles - Register a new vehicle
vehicleRouter.post('/', authorize('DRIVER'), async (req, res, next) => {
    try {
        const validated = vehicleSchema.parse(req.body);
        const driverId = req.user!.userId;

        // Create vehicle
        const vehicle = await prisma.vehicle.create({
            data: {
                ...validated,
                driverId,
                status: 'PENDING',
                isVerified: false
            }
        });

        // Create a verification request automatically
        await prisma.verificationRequest.create({
            data: {
                entityType: 'VEHICLE',
                entityId: vehicle.id,
                status: 'PENDING',
                officialName: `${validated.model} (${validated.plateNumber})`,
                registrationNumber: validated.plateNumber,
                businessLicenseUrl: validated.registrationCert,
                identityProofUrl: validated.licensePhotoUrl,
                livePhotoUrl: validated.vehiclePhotoUrl
            }
        });

        res.status(201).json({ success: true, data: vehicle });
    } catch (e) { next(e); }
});

// GET /api/vehicles/my - Get driver's vehicles
vehicleRouter.get('/my', authorize('DRIVER'), async (req, res, next) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { driverId: req.user!.userId },
            include: {
                batches: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        res.json({ success: true, data: vehicles });
    } catch (e) { next(e); }
});

// GET /api/vehicles - Admin: Get all vehicles
vehicleRouter.get('/', authorize('SUPER_ADMIN', 'TRANSPORT_ADMIN'), async (req, res, next) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: vehicles });
    } catch (e) { next(e); }
});

// PATCH /api/vehicles/:id/status - Admin: Review vehicle
const vehicleReviewSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

vehicleRouter.patch('/:id/review', authorize('SUPER_ADMIN', 'TRANSPORT_ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = vehicleReviewSchema.parse(req.body);

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: id as string }
        });

        if (!vehicle) throw new AppError('Машин олдсонгүй', 404);

        const updated = await prisma.vehicle.update({
            where: { id: id as string },
            data: {
                status,
                isVerified: status === 'APPROVED'
            }
        });

        // Update verification request if exists
        const verRequest = await prisma.verificationRequest.findFirst({
            where: { entityId: vehicle.id, entityType: 'VEHICLE', status: 'PENDING' }
        });

        if (verRequest) {
            await prisma.verificationRequest.update({
                where: { id: verRequest.id },
                data: {
                    status,
                    rejectionReason: rejectionReason || null,
                    reviewerId: req.user!.userId,
                    reviewedAt: new Date()
                }
            });
        }

        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});
