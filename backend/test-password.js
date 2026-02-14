const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPassword() {
    const user = await prisma.user.findUnique({ where: { phone: '99112233' } });

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log('✅ User found:', user.phone, user.firstName, user.role);
    console.log('OTP Verified:', user.otpVerified);
    console.log('Is Active:', user.isActive);

    const testPassword = 'admin123456';
    const isMatch = await bcrypt.compare(testPassword, user.password);

    console.log('\nPassword test:');
    console.log('Testing password:', testPassword);
    console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

    // Also test hashing a new password
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('\nNew hash for comparison:', newHash.substring(0, 30) + '...');
    console.log('Stored hash:', user.password.substring(0, 30) + '...');

    await prisma.$disconnect();
}

testPassword().catch(console.error);
