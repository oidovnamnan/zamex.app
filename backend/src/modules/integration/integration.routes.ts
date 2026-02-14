import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const integrationRouter = Router();
integrationRouter.use(authenticate);

const createApiKeySchema = z.object({
    name: z.string().min(1).max(50),
    scopes: z.array(z.string()).optional(),
    expiresInDays: z.number().optional(),
});

// GET /api/integration/keys - List API keys for company
integrationRouter.get('/keys', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
    try {
        const companyId = req.user!.companyId;
        if (!companyId && req.user!.role !== 'SUPER_ADMIN') {
            throw new AppError('Компани олдсонгүй', 400);
        }

        const where = req.user!.role === 'SUPER_ADMIN' ? {} : { companyId };

        const keys = await (prisma as any).companyApiKey.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { keys } });
    } catch (e) { next(e); }
});

// POST /api/integration/keys - Generate a new API key
integrationRouter.post('/keys', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
    try {
        const { name, scopes, expiresInDays } = createApiKeySchema.parse(req.body);
        const companyId = req.user!.companyId;

        if (!companyId) throw new AppError('Компани олдсонгүй', 400);

        // Generate prefix zx_
        const keyPrefix = 'zx_' + crypto.randomBytes(4).toString('hex');
        const secretKey = crypto.randomBytes(32).toString('hex');
        const fullKey = `${keyPrefix}.${secretKey}`;

        const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        const apiKey = await (prisma as any).companyApiKey.create({
            data: {
                companyId,
                name,
                keyHash,
                keyPrefix,
                scopes: scopes || ['full_access'],
                expiresAt,
            }
        });

        // We only show the full key ONCE upon creation
        res.status(201).json({
            success: true,
            message: 'API Key амжилттай үүслээ. Энэ түлхүүрийг хадгалж аваарай, дахин харах боломжгүй.',
            data: {
                id: apiKey.id,
                name: apiKey.name,
                apiKey: fullKey,
                expiresAt: apiKey.expiresAt
            }
        });
    } catch (e) { next(e); }
});

// DELETE /api/integration/keys/:id - Revoke API key
integrationRouter.delete('/keys/:id', authorize('CARGO_ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const key = await (prisma as any).companyApiKey.findUnique({ where: { id } });
        if (!key) throw new AppError('API Key олдсонгүй', 404);

        if (req.user!.role !== 'SUPER_ADMIN' && key.companyId !== companyId) {
            throw new AppError('Эрх хүрэлцэхгүй', 403);
        }

        await (prisma as any).companyApiKey.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ success: true, message: 'API Key идэвхгүй боллоо' });
    } catch (e) { next(e); }
});
