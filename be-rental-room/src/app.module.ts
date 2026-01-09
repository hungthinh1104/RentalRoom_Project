import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './database/prisma/prisma.service';
import { getCacheConfig } from './config/cache.config';
import { getMailConfig } from './config/mail.config';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { CacheService } from './common/services/cache.service';
import { CleanupService } from './tasks/cleanup.service';

import {
  AuthModule,
  UsersModule,
  LandlordsModule,
  TenantsModule,
  PropertiesModule,
  RoomsModule,
  ServicesModule,
  ContractsModule,
  BillingModule,
  PaymentsModule,
  MaintenanceModule,
  NotificationsModule,
  RecommendationModule,
  UploadModule,
  FavoritesModule,
} from './modules';
import { ReportsModule } from './modules/reports/reports.module';
import { AIModule } from './modules/ai/ai.module';
import { SystemFeedbackModule } from './modules/system-feedback/system-feedback.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { ConsentModule } from './modules/consent/consent.module';
import { TaxModule } from './modules/tax/tax.module';
import { IncomeModule } from './modules/income/income.module';
import { LegalDocumentsModule } from './modules/legal-documents/legal-documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: getCacheConfig,
    }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMailConfig,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    UsersModule,
    LandlordsModule,
    TenantsModule,
    PropertiesModule,
    RoomsModule,
    ServicesModule,
    ContractsModule,
    BillingModule,
    PaymentsModule,
    MaintenanceModule,
    NotificationsModule,
    RecommendationModule,
    ReportsModule,
    AIModule,
    SystemFeedbackModule,
    SnapshotsModule,
    ConsentModule,
    TaxModule,
    UploadModule,
    FavoritesModule,
    IncomeModule,
    LegalDocumentsModule, // CRITICAL: Legal documents with version control
  ],
  providers: [
    PrismaService,
    CacheService,
    CleanupService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
