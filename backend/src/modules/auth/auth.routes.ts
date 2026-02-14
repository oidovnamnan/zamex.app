import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import { authenticate, JwtPayload } from '../../middleware/auth';

export const authRouter = Router();

// ═══ Validation Schemas ═══

const registerSchema = z.object({
  phone: z.string().min(8).max(15),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
  password: z.string().min(6).max(100),
  language: z.enum(['MN', 'EN', 'CN']).default('MN'),
  referredByCode: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(8).max(15),
  password: z.string().min(1),
});

const otpRequestSchema = z.object({
  phone: z.string().min(8).max(15).optional(),
  email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
  message: "Утасны дугаар эсвэл имэйл хаягийн аль нэгийг оруулна уу",
});

const otpVerifySchema = z.object({
  phone: z.string().min(8).max(15).optional(),
  email: z.string().email().optional(),
  otp: z.string().length(4),
}).refine(data => data.phone || data.email, {
  message: "Утасны дугаар эсвэл имэйл хаягийн аль нэгийг оруулна уу",
});

// ═══ Helpers ═══

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
  });
  return { accessToken, refreshToken };
}

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ═══ Routes ═══

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      throw new AppError('Энэ утасны дугаараар бүртгэл үүссэн байна', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otp = generateOtp();

    // Referral logic
    let referredById: string | undefined;
    if (data.referredByCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: data.referredByCode } as any });
      if (referrer) referredById = referrer.id;
    }

    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: 'CUSTOMER',
        language: data.language as any,
        otpCode: otp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        referredById,
        referralCode: uuid().slice(0, 8).toUpperCase(), // Initial code
      } as any,
      select: { id: true, phone: true, firstName: true, role: true },
    });

    // TODO: Send OTP via SMS
    console.log(`📱 OTP for ${data.phone}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Бүртгэл амжилттай. OTP код илгээлээ.',
      data: { userId: user.id, phone: user.phone },
    });
  } catch (e) { next(e); }
});

// POST /api/auth/otp/request
authRouter.post('/otp/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, email } = otpRequestSchema.parse(req.body);

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : {},
          email ? { email } : {},
        ].filter(v => Object.keys(v).length > 0)
      }
    });

    if (!user) {
      // Allow auto-registration for both phone and email
      user = await prisma.user.create({
        data: {
          email: email || undefined,
          phone: phone || `TEMP_${uuid().slice(0, 8)}`,
          firstName: phone ? `User ${phone.slice(-4)}` : (email ? email.split('@')[0] : 'New User'),
          password: await bcrypt.hash(uuid(), 12),
          role: 'CUSTOMER',
        }
      });
    }

    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        otpRetryCount: 0,
        otpLockedUntil: null,
      }
    });

    if (phone) {
      console.log(`📱 OTP for phone ${phone}: ${otp}`);
      // SMS logic here
    } else {
      console.log(`📧 OTP for email ${email}: ${otp}`);
      // Email logic here
    }

    res.json({
      success: true,
      message: 'OTP код илгээлээ',
      data: { phone, email }
    });
  } catch (e) { next(e); }
});

// POST /api/auth/otp/verify
authRouter.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, email, otp } = otpVerifySchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : {},
          email ? { email } : {},
        ].filter(v => Object.keys(v).length > 0)
      }
    });

    if (!user) throw new AppError('Хэрэглэгч олдсонгүй', 404);

    // Check if locked
    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      throw new AppError(`Олон удаа буруу оролдсон тул түр цоожлогдлоо. ${Math.ceil((user.otpLockedUntil.getTime() - Date.now()) / 60000)} минутын дараа дахин оролдоно уу.`, 403);
    }

    if (!user.otpCode || !user.otpExpiresAt) throw new AppError('OTP код илгээгдээгүй', 400);
    if (new Date() > user.otpExpiresAt) throw new AppError('OTP код хугацаа дууссан', 400);

    // Verify OTP
    if (user.otpCode !== otp) {
      const newRetries = user.otpRetryCount + 1;
      const isLocking = newRetries >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpRetryCount: newRetries,
          otpLockedUntil: isLocking ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 min lock
        }
      });

      throw new AppError(isLocking ? 'Олон удаа буруу оролдсон тул 15 минут цоожлогдлоо.' : `OTP код буруу. Танд ${5 - newRetries} оролдлого үлдлээ.`, 400);
    }

    // Success - reset retries
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        otpRetryCount: 0,
        otpLockedUntil: null,
        lastLogin: new Date()
      },
    });

    const payload: JwtPayload = { userId: user.id, role: user.role, companyId: user.companyId || undefined };
    const tokens = generateTokens(payload);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: 'Баталгаажлаа',
      data: {
        user: { id: user.id, phone: user.phone, firstName: user.firstName, role: user.role },
        tokens,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      throw new AppError('Утас эсвэл нууц үг буруу', 401);
    }
    if (!user.isActive) throw new AppError('Хэрэглэгч идэвхгүй байна', 403);

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Утас эсвэл нууц үг буруу', 401);
    }

    if (!user.otpVerified) {
      // Resend OTP
      const otp = generateOtp();
      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      });

      return res.json({
        success: true,
        message: 'OTP баталгаажуулалт шаардлагатай',
        data: { requireOtp: true, phone: user.phone },
      });
    }

    const payload: JwtPayload = { userId: user.id, role: user.role, companyId: user.companyId || undefined };
    const tokens = generateTokens(payload);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
        tokens,
      },
    });
  } catch (e) { next(e); }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token шаардлагатай', 400);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) throw new AppError('Token хүчингүй', 401);
    if (new Date() > stored.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError('Token хугацаа дууссан', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) throw new AppError('Хэрэглэгч олдсонгүй', 401);

    // Delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const payload: JwtPayload = { userId: user.id, role: user.role, companyId: user.companyId || undefined };
    const tokens = generateTokens(payload);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: { tokens } });
  } catch (e) { next(e); }
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Амжилттай гарлаа' });
  } catch (e) { next(e); }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, phone: true, firstName: true, lastName: true,
        role: true, companyId: true, isVerified: true, verificationStatus: true,
        company: {
          select: { id: true, name: true, isVerified: true, verificationStatus: true }
        },
        customerCompanies: {
          include: { company: { select: { id: true, name: true, codePrefix: true, logoUrl: true } } },
        },
      },
    });
    if (!user) throw new AppError('Хэрэглэгч олдсонгүй', 404);

    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});
