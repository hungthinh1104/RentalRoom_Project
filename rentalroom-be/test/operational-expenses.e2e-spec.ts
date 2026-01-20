import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { createTestingApp } from './utils/setup';
import { TestDataFactory } from './utils/test-data.factory';

describe('Operational Expenses (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let landlordToken: string;
    let landlordId: string;

    beforeAll(async () => {
        const testingApp = await createTestingApp();
        app = testingApp.app;
        prisma = testingApp.prisma;

        // Register Landlord
        const email = `landlord_exp_${Date.now()}@test.com`;
        const password = 'Password123!';

        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email,
                password,
                fullName: 'Expense Landlord',
                phone: `09${Date.now().toString().slice(-8)}`,
                role: 'LANDLORD',
            })
            .expect(201);

        // Manually verify email
        await prisma.user.update({
            where: { email },
            data: { emailVerified: true }
        });

        // Login to get token
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email, password })
            .expect(200);

        landlordToken = loginRes.body.access_token;
        landlordId = loginRes.body.user.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/operational-expenses (POST)', () => {
        it('should create an expense', async () => {
            const dto = {
                amount: 500000,
                date: new Date().toISOString(),
                category: 'MAINTENANCE',
                description: 'Fixing AC',
            };

            const res = await request(app.getHttpServer())
                .post('/api/v1/operational-expenses')
                .set('Authorization', `Bearer ${landlordToken}`)
                .send(dto)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.amount).toBe("500000"); // Decimal returns string usually
            expect(res.body.category).toBe('MAINTENANCE');
        });

        it('should fail validation (negative amount)', async () => {
            const dto = {
                amount: -100,
                date: new Date().toISOString(),
                category: 'MAINTENANCE',
            };

            await request(app.getHttpServer())
                .post('/api/v1/operational-expenses')
                .set('Authorization', `Bearer ${landlordToken}`)
                .send(dto)
                .expect(400);
        });
    });

    describe('/operational-expenses (GET)', () => {
        it('should list expenses', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/operational-expenses')
                .set('Authorization', `Bearer ${landlordToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter by date', async () => {
            // Create past expense
            await prisma.operationalExpense.create({
                data: {
                    landlordId,
                    amount: 100000,
                    category: 'TAX',
                    date: new Date('2025-01-01'),
                    description: 'Past tax'
                }
            });

            const res = await request(app.getHttpServer())
                .get('/api/v1/operational-expenses?startDate=2025-01-01&endDate=2025-01-02')
                .set('Authorization', `Bearer ${landlordToken}`)
                .expect(200);

            // Should find the one we just created
            const found = res.body.find((e: any) => e.description === 'Past tax');
            expect(found).toBeDefined();
        });
    });
});
