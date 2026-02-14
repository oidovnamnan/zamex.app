import { Router } from 'express';
import { authenticate, ensureVerifiedCargo } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const marketplaceRouter = Router();

// Publicly viewable listings
marketplaceRouter.get('/', async (req, res, next) => {
    try {
        const { type, status, origin, destination } = req.query;

        const where: any = {
            status: (status as string) || 'OPEN'
        };

        if (type) where.type = type;
        if (origin) where.origin = { contains: origin as string };
        if (destination) where.destination = { contains: destination as string };

        const listings = await prisma.marketplaceListing.findMany({
            where,
            include: {
                user: { select: { firstName: true, lastName: true, isVerified: true, avatarUrl: true } },
                company: { select: { name: true, isVerified: true, logoUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: listings });
    } catch (e) { next(e); }
});

// Protected routes
marketplaceRouter.use(authenticate);
marketplaceRouter.use(ensureVerifiedCargo);

const listingSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    type: z.enum(['CARGO_WANTED', 'TRANSPORT_OFFERED', 'LOAD_REQUEST']),
    price: z.number().optional(),
    currency: z.string().default('MNT'),
    volume: z.number().optional(),
    weight: z.number().optional(),
    origin: z.string().optional(),
    destination: z.string().optional(),
    expiresAt: z.string().optional(),
});

// POST /api/marketplace - Post a new ad
marketplaceRouter.post('/', async (req, res, next) => {
    try {
        // SECURITY: Only verified entities can post to prevent fraud
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        const company = req.user!.companyId ? await prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null;

        const isUserVerified = user?.isVerified;
        const isCompanyVerified = company?.isVerified;

        if (!isUserVerified && !isCompanyVerified) {
            throw new AppError('Зар тавихын тулд та эхлээд баталгаажуулалт (Verification) хийлгэсэн байх ёстой.', 403);
        }

        const validated = listingSchema.parse(req.body);

        const listing = await prisma.marketplaceListing.create({
            data: {
                ...validated,
                userId: req.user!.userId,
                companyId: req.user!.companyId,
                expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null
            }
        });

        res.status(201).json({ success: true, data: listing });
    } catch (e) { next(e); }
});

// PATCH /api/marketplace/:id - Update listing
marketplaceRouter.patch('/:id', async (req, res, next) => {
    try {
        const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
        if (!listing) throw new AppError('Зар олдсонгүй', 404);

        // Check ownership
        if (listing.userId !== req.user!.userId) {
            throw new AppError('Зөвхөн өөрийн зарыг засах боломжтой', 403);
        }

        const validated = listingSchema.partial().parse(req.body);
        const updated = await prisma.marketplaceListing.update({
            where: { id: req.params.id },
            data: {
                ...validated,
                expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined
            }
        });

        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});

// DELETE /api/marketplace/:id - Close/Delete listing
marketplaceRouter.delete('/:id', async (req, res, next) => {
    try {
        const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
        if (!listing) throw new AppError('Зар олдсонгүй', 404);

        if (listing.userId !== req.user!.userId) {
            throw new AppError('Зөвхөн өөрийн зарыг устгах боломжтой', 403);
        }

        await prisma.marketplaceListing.update({
            where: { id: req.params.id },
            data: { status: 'CANCELLED' }
        });

        res.json({ success: true, message: 'Зар цуцлагдлаа' });
    } catch (e) { next(e); }
});
// POST /api/marketplace/:id/bids - Place a bid on a listing
marketplaceRouter.post('/:id/bids', async (req, res, next) => {
    try {
        const { price, currency, notes, vehicleId } = req.body;
        const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });

        if (!listing) throw new AppError('Зар олдсонгүй', 404);
        if (listing.status !== 'OPEN') throw new AppError('Энэ зар хаагдсан байна', 400);

        const bid = await prisma.marketplaceBid.create({
            data: {
                listingId: listing.id,
                bidderId: req.user!.userId,
                companyId: req.user!.companyId,
                amount: price || listing.price || 0,
                currency: currency || listing.currency,
                notes,
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, data: bid });
    } catch (e) { next(e); }
});

// PATCH /api/marketplace/bids/:bidId/accept - Accept a bid (Cargo Admin only)
marketplaceRouter.patch('/bids/:bidId/accept', async (req, res, next) => {
    try {
        const bid = await prisma.marketplaceBid.findUnique({
            where: { id: req.params.bidId },
            include: { listing: true }
        });

        if (!bid) throw new AppError('Үнийн санал олдсонгүй', 404);

        // Check if current user owns the listing
        if (bid.listing.userId !== req.user!.userId) {
            throw new AppError('Зөвхөн зарын эзэн саналыг зөвшөөрөх эрхтэй', 403);
        }

        const result = await prisma.$transaction([
            // Update bid status
            prisma.marketplaceBid.update({
                where: { id: bid.id },
                data: { status: 'ACCEPTED' }
            }),
            // Close the listing
            prisma.marketplaceListing.update({
                where: { id: bid.listingId },
                data: { status: 'CLOSED' }
            }),
            // Reject other bids
            prisma.marketplaceBid.updateMany({
                where: {
                    listingId: bid.listingId,
                    id: { not: bid.id }
                },
                data: { status: 'REJECTED' }
            })
        ]);

        res.json({
            success: true,
            message: 'Үнийн санал баталгаажлаа. Одоо Batch үүсгэн тээвэрлэлтийг эхлүүлнэ үү.',
            data: result[0]
        });
    } catch (e) { next(e); }
});
