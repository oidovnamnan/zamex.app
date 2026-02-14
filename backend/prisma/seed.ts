
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Demo Company
    const companyName = 'Zamex Demo Cargo';
    let company = await prisma.company.findUnique({
        where: { codePrefix: 'ZMX' },
    });

    if (!company) {
        console.log('Creating demo company...');
        company = await prisma.company.create({
            data: {
                name: companyName,
                codePrefix: 'ZMX',
                slug: 'zamex-demo',
                type: 'BOTH',
                isActive: true,
                isVerified: true,
                verificationStatus: 'APPROVED'
            },
        });
    } else {
        console.log('Demo company already exists.');
    }

    // 2. Define Users
    const users = [
        {
            phone: '99112233',
            password: 'admin123',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN' as UserRole,
            companyId: null,
        },
        {
            phone: '99887766',
            password: 'customer123',
            firstName: 'Demo',
            lastName: 'Customer',
            role: 'CUSTOMER' as UserRole,
            companyId: null,
        },
        {
            phone: '88001122',
            password: 'cargo123456',
            firstName: 'Demo',
            lastName: 'Cargo Admin',
            role: 'CARGO_ADMIN' as UserRole,
            companyId: company.id,
        },
        {
            phone: '88440011',
            password: 'staffchina123',
            firstName: 'Demo',
            lastName: 'Erlian Staff',
            role: 'STAFF_ERLIAN' as UserRole,
            companyId: company.id,
        },
        {
            phone: '88440022',
            password: 'staffmn123',
            firstName: 'Demo',
            lastName: 'UB Staff',
            role: 'STAFF_MONGOLIA' as UserRole,
            companyId: company.id,
        },
        {
            phone: '88112233',
            password: 'driver123456',
            firstName: 'Demo',
            lastName: 'Driver',
            role: 'DRIVER' as UserRole,
            companyId: company.id,
        },
    ];

    // 3. Upsert Users
    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 12);

        const existing = await prisma.user.findUnique({ where: { phone: u.phone } });

        if (!existing) {
            console.log(`Creating user: ${u.role} (${u.phone})`);
            await prisma.user.create({
                data: {
                    phone: u.phone,
                    password: hashedPassword,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                    companyId: u.companyId,
                    isActive: true,
                    otpVerified: true, // Auto-verify demo users
                    isVerified: true,
                    verificationStatus: 'APPROVED'
                }
            });
        } else {
            console.log(`User ${u.phone} already exists. Updating password/role/verification...`);
            // Optional: Update password/role to ensure demo works even if changed
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    password: hashedPassword,
                    role: u.role,
                    companyId: u.companyId,
                    isActive: true,
                    otpVerified: true,
                    verificationStatus: 'APPROVED'
                }
            });
        }
    }

    console.log('✅ Seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
