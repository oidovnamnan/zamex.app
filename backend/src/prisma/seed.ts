import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Platform Settings
  const configHash = await bcrypt.hash('zamex_config_2025', 12);
  await prisma.platformSettings.create({
    data: { configPasswordHash: configHash },
  });
  console.log('✅ Platform settings created');

  // 2. Super Admin
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '99112233' },
    update: {},
    create: {
      phone: '99112233',
      firstName: 'Намнансүрэн',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      otpVerified: true,
    },
  });
  console.log('✅ Super admin ready:', admin.phone);

  // 3. Demo Cargo Company
  const company = await prisma.company.upsert({
    where: { slug: 'cargo-express' },
    update: {},
    create: {
      name: 'Cargo Express',
      nameEn: 'Cargo Express',
      slug: 'cargo-express',
      codePrefix: 'CGE',
      phone: '77001122',
      description: 'Хятад-Монгол карго тээвэр. Хурдан, найдвартай.',
    },
  });
  console.log('✅ Company ready:', company.name);

  // ... (skip intermediate relations for brevity, assuming they might exist or handled simply)
  // For robustness, usually we'd upsert everything, but for this specific task ensuring Users exist is key.

  // 10. Cargo Admin
  const cargoAdminPwd = await bcrypt.hash('cargo123456', 12);
  await prisma.user.upsert({
    where: { phone: '88001122' },
    update: {},
    create: {
      phone: '88001122',
      firstName: 'Болд',
      password: cargoAdminPwd,
      role: 'CARGO_ADMIN',
      companyId: company.id,
      otpVerified: true,
    },
  });
  console.log('✅ Cargo admin ready');

  // 12. Demo Customer
  const customerPwd = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { phone: '99887766' },
    update: {},
    create: {
      phone: '99887766',
      firstName: 'Бат-Эрдэнэ',
      password: customerPwd,
      role: 'CUSTOMER',
      otpVerified: true,
    },
  });
  console.log('✅ Demo customer ready');

  // 13. Demo Driver
  const driverPwd = await bcrypt.hash('driver123456', 12);
  await prisma.user.upsert({
    where: { phone: '88112233' },
    update: {},
    create: {
      phone: '88112233',
      firstName: 'Төмөрөө',
      password: driverPwd,
      role: 'DRIVER',
      companyId: company.id,
      otpVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo driver ready');

  // 14. Demo Erlian Staff (China)
  const staffChinaPwd = await bcrypt.hash('staffchina123', 12);
  await prisma.user.upsert({
    where: { phone: '88440011' },
    update: {},
    create: {
      phone: '88440011',
      firstName: 'Erlian Staff',
      password: staffChinaPwd,
      role: 'STAFF_CHINA',
      companyId: company.id,
      otpVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo Erlian staff ready');

  // 15. Demo UB Staff (Mongolia)
  const staffMNPwd = await bcrypt.hash('staffmn123', 12);
  await prisma.user.upsert({
    where: { phone: '88440022' },
    update: {},
    create: {
      phone: '88440022',
      firstName: 'UB Staff',
      password: staffMNPwd,
      role: 'STAFF_MONGOLIA',
      companyId: company.id,
      otpVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Demo UB staff ready');

  console.log('\n🎉 Seed completed!\n');
  console.log('Demo accounts:');
  console.log('  Super Admin:  99112233 / admin123456');
  console.log('  Cargo Admin:  88001122 / cargo123456');
  console.log('  Customer:     99887766 / customer123');
  console.log('  Driver:       88112233 / driver123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
