import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  companyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      apiKeyScopes?: string[];
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Нэвтрэх шаардлагатай', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return next(new AppError('Token хүчингүй эсвэл хугацаа дууссан', 401));
  }
}

export async function authenticateApiKey(req: Request, _res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return next(new AppError('API Key шаардлагатай', 401));
  }

  try {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const dbKey = await (prisma as any).companyApiKey.findUnique({
      where: { keyHash },
      include: { company: true }
    });

    if (!dbKey || !dbKey.isActive) {
      return next(new AppError('API Key хүчингүй байна', 401));
    }

    if (dbKey.expiresAt && dbKey.expiresAt < new Date()) {
      return next(new AppError('API Key хугацаа дууссан байна', 401));
    }

    // Attach systemic user info to request
    req.user = {
      userId: `API_${dbKey.id}`,
      role: 'EXTERNAL_API' as any,
      companyId: dbKey.companyId,
      companyType: dbKey.company.type as any
    } as any;
    req.apiKeyScopes = (dbKey.scopes as string[]) || [];

    // Update last used at in background
    (prisma as any).companyApiKey.update({
      where: { id: dbKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);

    next();
  } catch (err) {
    next(err);
  }
}

export function checkScope(requiredScope: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Only apply scope check for API Key authentication
    if (req.user?.role !== 'EXTERNAL_API' as any) return next();

    const scopes = req.apiKeyScopes || [];
    if (scopes.includes('full_access') || scopes.includes(requiredScope)) {
      return next();
    }

    return next(new AppError(`API Key scope '${requiredScope}' required`, 403));
  };
}

export function authorize(...roles: (UserRole | string)[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('Authorize failed: No user attached to request');
      return next(new AppError('Нэвтрэх шаардлагатай', 401));
    }

    // Debugging
    console.log(`Authorize Check: UserRole=${req.user.role}, AllowedRoles=${roles}`);

    if (!roles.includes(req.user.role)) {
      console.log('Authorize failed: Role mismatch');
      return next(new AppError('Эрх хүрэлцэхгүй байна', 403));
    }
    next();
  };
}

export function authorizeCompany(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError('Нэвтрэх шаардлагатай', 401));
  if (req.user.role === 'SUPER_ADMIN') return next();

  const companyId = req.params.companyId || req.body.companyId;
  if (companyId && req.user.companyId !== companyId) {
    return next(new AppError('Энэ компанид хандах эрхгүй байна', 403));
  }
  next();
}

export async function ensureVerifiedCargo(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError('Нэвтрэх шаардлагатай', 401));
  if (req.user.role === 'SUPER_ADMIN') return next();

  if (!req.user.companyId) {
    return next(new AppError('Та компанид харьяалагдаагүй байна', 403));
  }

  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
    // @ts-ignore - Prisma type issue
    select: { verificationStatus: true, status: true, isActive: true }
  });

  if (!company) {
    return next(new AppError('Компани олдсонгүй', 404));
  }

  if (company.status === 'SUSPENDED') {
    return next(new AppError('Таны компанийн үйл ажиллагааг зөрчлийн улмаас түр зогсоосон байна (SUSPENDED). Админтай холбогдоно уу.', 403));
  }

  if (!company.isActive) {
    return next(new AppError('Таны компани идэвхгүй байна.', 403));
  }

  if (company.verificationStatus !== 'APPROVED') {
    return next(new AppError('Таны компанийн үйл ажиллагаа явуулах эрх нээгдээгүй байна (Баталгаажуулалт шаардлагатай)', 403));
  }

  next();
}

/**
 * Хамгийн нарийн эрх шалгах middleware. 
 * Жишээ нь: hasPermission('CAN_SCAN')
 */
export function hasPermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Нэвтрэх шаардлагатай', 401));

    // Super Admin болон Cargo Admin бүх эрхтэй
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'CARGO_ADMIN') {
      return next();
    }

    // Хэрэглэгчийн RoleTemplate-ийг шалгах
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        roleTemplate: {
          select: { permissions: true }
        }
      }
    });

    const permissions = (user?.roleTemplate?.permissions as string[]) || [];

    if (!permissions.includes(permission)) {
      return next(new AppError(`Танд энэ үйлдлийг хийх эрх байхгүй байна (${permission})`, 403));
    }

    next();
  };
}

export function hasAnyPermission(requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Нэвтрэх шаардлагатай', 401));
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'CARGO_ADMIN') return next();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        roleTemplate: {
          select: { permissions: true }
        }
      }
    });

    const permissions = (user?.roleTemplate?.permissions as string[]) || [];
    const hasAny = requiredPermissions.some(p => permissions.includes(p));

    if (!hasAny) {
      return next(new AppError('Танд шаардлагатай эрх байхгүй байна', 403));
    }

    next();
  };
}
