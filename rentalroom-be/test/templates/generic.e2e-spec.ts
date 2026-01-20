import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma/prisma.service';
import { createTestingApp } from '../utils/setup';
import { TestDataFactory } from '../utils/test-data.factory';

describe('Generic Module E2E Template', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let landlordToken: string;
  let tenantToken: string;

  beforeAll(async () => {
    const testingApp = await createTestingApp();
    app = testingApp.app;
    prisma = testingApp.prisma;

    // Helper to get tokens (assuming Auth module works)
    // You might need to seed users first if DB is empty
    // const admin = await registerAndLogin(app, 'ADMIN');
    // adminToken = admin.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health/simple (GET)', () => {
    it('should return 200 and ok status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/simple')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('/endpoint (POST)', () => {
    it('should create new item', () => {
      // const dto = TestDataFactory.createSomething();
      // return request(app.getHttpServer())
      //   .post('/api/v1/endpoint')
      //   .set('Authorization', `Bearer ${adminToken}`)
      //   .send(dto)
      //   .expect(201);
    });
  });
});
