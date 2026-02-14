import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const specs = [
        { slug: 'electronics', nameMn: 'Цахилгаан бараа', nameEn: 'Electronics', icon: 'Zap' },
        { slug: 'clothing', nameMn: 'Хувцас, гутал', nameEn: 'Clothing & Shoes', icon: 'Shirt' },
        { slug: 'furniture', nameMn: 'Тавилга', nameEn: 'Furniture', icon: 'Home' },
        { slug: 'auto-parts', nameMn: 'Авто сэлбэг', nameEn: 'Auto Parts', icon: 'Car' },
        { slug: 'cosmetics', nameMn: 'Гоо сайхан', nameEn: 'Cosmetics & Beauty', icon: 'Sparkles' },
        { slug: 'food', nameMn: 'Хүнс, амттан', nameEn: 'Food & Sweets', icon: 'Apple' },
        { slug: 'dangerous-goods', nameMn: 'Аюултай ачаа', nameEn: 'Dangerous Goods', icon: 'AlertTriangle' },
        { slug: 'household', nameMn: 'Гэр ахуй', nameEn: 'Household Items', icon: 'ShoppingBag' },
    ];

    console.log('Seeding specializations...');

    for (const s of specs) {
        await prisma.specialization.upsert({
            where: { slug: s.slug },
            update: s,
            create: s,
        });
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
