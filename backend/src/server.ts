import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { companiesRouter } from './modules/companies/companies.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { packagesRouter } from './modules/packages/packages.routes';
import { batchesRouter } from './modules/batches/batches.routes';
import { invoicesRouter } from './modules/invoices/invoices.routes';
import { returnsRouter } from './modules/returns/returns.routes';
import { ratingsRouter } from './modules/ratings/ratings.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { settlementsRouter } from './modules/settlements/settlements.routes';
import { unidentifiedRouter } from './modules/unidentified/unidentified.routes';
import { uploadRouter } from './modules/upload/upload.routes';
import { customsRouter } from './modules/customs/customs.routes';
import { insuranceRouter } from './modules/insurance/insurance.routes';
import { verificationRouter } from './modules/verification/verification.routes';
import { marketplaceRouter } from './modules/marketplace/marketplace.routes';
import { vehicleRouter } from './modules/vehicle/vehicle.routes';
import { specializationsRouter } from './modules/companies/specializations.routes';
import { integrationRouter } from './modules/integration/integration.routes';
import { externalRouter } from './modules/external/external.routes';
import { publicRouter } from './modules/public/public.routes';
import deliveryPointsRouter from './modules/delivery-points/delivery-points.routes';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
app.use('/api', limiter);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/unidentified', unidentifiedRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/customs', customsRouter);
app.use('/api/insurance', insuranceRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/specializations', specializationsRouter);
app.use('/api/integration', integrationRouter);
app.use('/api/v1/external', externalRouter);
app.use('/api/public', publicRouter);
app.use('/api/delivery-points', deliveryPointsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Error handler
app.use(errorHandler);

// Start
async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  app.listen(PORT, () => {
    console.log(`🚀 zamex.app API running on port ${PORT}`);
  });
}

main().catch((e) => {
  console.error('❌ Server failed to start:', e);
  prisma.$disconnect();
  process.exit(1);
});

export default app;
