import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function seedRegulations() {
    console.log('🌱 Seeding initial regulations...');

    // Get current timestamp in Vietnam timezone (GMT+7)
    const effectiveDate = new Date('2026-01-01T00:00:00+07:00');

    // Hash content for integrity
    const content = `
RENTAL TAX REGULATION - Vietnam 2026

Based on:
- Law on Personal Income Tax (amended 2025, effective 2026)
- Decree on rental income taxation

Key points:
- Annual revenue threshold: 500,000,000 VND
- Tax obligation applies to individuals renting 5+ properties
- Platform must provide revenue reports
- Landlords responsible for self-declaration

Reference: 
- https://news.laodong.vn/kinh-doanh/thue-cho-thue-nha-tu-2026
- https://en.baochinhphu.vn/law-on-personal-income-tax-approved
  `.trim();

    const contentHash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

    const regulation = await prisma.regulationVersion.upsert({
        where: {
            type_version: {
                type: 'RENTAL_TAX',
                version: '2026.01',
            },
        },
        update: {},
        create: {
            type: 'RENTAL_TAX',
            version: '2026.01',
            summary: 'Vietnam Rental Income Tax 2026 - Threshold 500M VND/year for individuals with 5+ properties',
            contentHash,
            contentUrl: null, // Can upload PDF to storage later
            effectiveFrom: effectiveDate,
            effectiveTo: null, // Currently active, no end date
        },
    });

    console.log('✅ Seeded regulation:', regulation.type, regulation.version);
}

async function main() {
    try {
        await seedRegulations();
        console.log('✅ Seed completed successfully');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
