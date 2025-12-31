import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Cookie parser middleware (must be before routes)
  app.use(cookieParser());

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

  // Swagger documentation
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

  // Redirect root to Swagger and ignore favicon requests
  const server = app.getHttpAdapter().getInstance();
  server.use((req, res, next) => {
    if (req.path === '/') return res.redirect('/api/docs');
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
