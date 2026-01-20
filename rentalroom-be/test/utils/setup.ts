import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module'; // Adjust path as needed
import { PrismaService } from '../../src/database/prisma/prisma.service';
import cookieParser from 'cookie-parser';

export interface TestingApp {
    app: INestApplication;
    prisma: PrismaService;
}

export async function createTestingApp(): Promise<TestingApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Replicate main.ts config
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    await app.init();
    const prisma = app.get(PrismaService);

    return { app, prisma };
}
