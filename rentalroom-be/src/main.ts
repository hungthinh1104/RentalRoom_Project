import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { PaymentIdempotencyMiddleware } from './common/middleware/payment-idempotency.middleware';
import { PrismaService } from './database/prisma/prisma.service';

// Initialize Sentry for error monitoring (production only)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
        }
      }
      return event;
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Harden HTTP server + small perf wins
  const server = app.getHttpAdapter().getInstance();
  if (server?.disable) {
    server.disable('x-powered-by');
  }
  if (server?.set) {
    server.set('etag', 'strong');
    if (process.env.NODE_ENV === 'production') {
      server.set('trust proxy', 1);
    }
  }

  // Cookie parser middleware (must be before routes)
  app.use(cookieParser());

  // Compression middleware for better performance
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use the library-provided filter helper
        return (compression as any).filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
      level: 6, // Compression level (0-9, 6 is good balance)
    }),
  );

  // Security - relaxed Content Security Policy for development to allow HMR and local API
  if (process.env.NODE_ENV === 'development') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js dev uses eval
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: [
              "'self'",
              'data:',
              'blob:',
              'http://localhost:3000',
              'http://localhost:3001',
            ],
            connectSrc: [
              "'self'",
              'http://localhost:3000',
              'http://127.0.0.1:3000',
              'http://localhost:3001',
              'http://127.0.0.1:3001',
              'ws://localhost:3001',
              'wss://localhost:3001',
            ],
          },
        },
      }),
    );
  } else {
    app.use(helmet());
  }

  // Payment Idempotency Middleware (UC_PAY_01 - Replay Attack Prevention)
  const prismaService = app.get(PrismaService);
  app.use(new PaymentIdempotencyMiddleware(prismaService).use.bind(new PaymentIdempotencyMiddleware(prismaService)));

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : ['http://localhost:3001', 'http://localhost:3000'];

  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ✅ Security: Sanitize inputs + strict validation
  app.useGlobalPipes(
    new SanitizePipe(), // XSS protection
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (disabled in production for security/perf)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Smart Room Rental API')
      .setDescription('REST API for room rental management system')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('properties', 'Property management')
      .addTag('rooms', 'Room management')
      .addTag('contracts', 'Contract management')
      .addTag('billing', 'Billing & invoices')
      .addTag('payments', 'Payment processing')
      .addTag('maintenance', 'Maintenance requests')
      .addTag('services', 'Services & utilities')
      .addTag('notifications', 'Notifications')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } else {
    logger.log('Swagger disabled in production');
  }

  // Redirect root to Swagger and ignore favicon requests
  server.use((req, res, next) => {
    if (req.path === '/') {
      if (process.env.NODE_ENV !== 'production') {
        return res.redirect('/api/docs');
      }
      return res.status(200).send('OK');
    }
    if (req.path === '/favicon.ico') return res.status(204).end();
    next();
  });

  const port = process.env.PORT || 3005;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
