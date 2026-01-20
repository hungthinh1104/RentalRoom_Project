import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { createTestingApp } from './utils/setup';

describe('Auth Module (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const testingApp = await createTestingApp();
        app = testingApp.app;
        prisma = testingApp.prisma;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/auth/register (POST)', () => {
        it('should register a new landlord', async () => {
            const dto = {
                email: `landlord_${Date.now()}@test.com`,
                password: 'Password123!',
                fullName: 'Test Landlord',
                phone: '0901234567',
                role: 'LANDLORD',
            };

            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(dto)
                .expect(201);

            // Register returns { message }
            expect(res.body).toHaveProperty('message');
        });

        it('should fail with duplicate email', async () => {
            // Create user first
            const email = `dup_${Date.now()}@test.com`;
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email,
                    password: 'Password123!',
                    fullName: 'Original User',
                    phone: '0900000001',
                    role: 'LANDLORD',
                });

            // Try again
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email,
                    password: 'Password123!',
                    fullName: 'Duplicate User',
                    phone: '0900000002',
                    role: 'LANDLORD',
                })
                .expect(409); // Conflict
        });
    });

    describe('/auth/login (POST)', () => {
        it('should login successfully', async () => {
            const email = `login_${Date.now()}@test.com`;
            const password = 'Password123!';

            // Register
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email,
                    password,
                    fullName: 'Login User',
                    phone: '0900000003',
                    role: 'TENANT',
                });

            // Manually verify email
            await prisma.user.update({
                where: { email },
                data: { emailVerified: true }
            });

            // Login
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({ email, password })
                .expect(200);

            expect(res.body).toHaveProperty('access_token');
        });

        it('should fail with wrong password', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({ email: 'nonexistent@test.com', password: 'wrong' })
                .expect(401);
        });
    });
});
