import { Router } from 'express';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';

export const publicRouter = Router();

// GET /api/public/manifest/:token - Get digital manifest for customs
publicRouter.get('/manifest/:token', async (req, res, next) => {
    try {
        const { token } = req.params;

        const batch = await (prisma as any).batch.findUnique({
            where: { manifestToken: token },
            include: {
                company: {
                    select: {
                        name: true,
                        logoUrl: true,
                        phone: true,
                    }
                },
                driver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    }
                },
                packages: {
                    include: {
                        category: {
                            select: { name: true }
                        },
                        customs: {
                            select: {
                                hsCode: true,
                                declaredValue: true,
                            }
                        }
                    }
                }
            }
        });

        if (!batch) {
            throw new AppError('Манифест олдсонгүй эсвэл хүчингүй байна', 404);
        }

        // Return the manifest data
        res.json({
            success: true,
            data: {
                batchId: batch.id,
                batchCode: batch.batchCode,
                status: batch.status,
                company: batch.company,
                vehicle: {
                    plate: batch.vehiclePlate,
                    model: batch.vehicleModel,
                    type: batch.vehicleType,
                },
                driver: batch.driver,
                summary: {
                    totalPackages: batch.totalPackages,
                    totalWeight: batch.totalWeight,
                    departedAt: batch.departedAt,
                },
                packages: (batch.packages as any[]).map(p => ({
                    tracking: p.trackingNumber,
                    description: p.description,
                    category: p.category?.name,
                    weight: p.weightKg,
                    cbm: p.cbm,
                    condition: p.condition,
                    note: p.conditionNote,
                    hsCode: p.customs?.hsCode,
                    value: p.customs?.declaredValue,
                    photos: {
                        label: p.labelPhotoUrl,
                        items: p.packagePhotos
                    }
                }))
            }
        });
    } catch (e) {
        next(e);
    }
});
