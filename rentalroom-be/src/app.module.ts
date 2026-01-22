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
import { LegalIntegrityCron } from './tasks/legal-integrity.cron';

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
  DocumentsModule,
} from './modules';
import { ReportsModule } from './modules/reports/reports.module';
import { AIModule } from './modules/ai/ai.module';
import { SystemFeedbackModule } from './modules/system-feedback/system-feedback.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { ConsentModule } from './modules/consent/consent.module';
import { TaxModule } from './modules/tax/tax.module';
import { IncomeModule } from './modules/income/income.module';
import { LegalDocumentsModule } from './modules/legal-documents/legal-documents.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PCCCModule } from './modules/pccc/pccc.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { eKycModule } from './shared/integration/ekyc/ekyc.module';
import { LegalInfrastructureModule } from './shared/legal-infrastructure.module';
import { UtilitiesModule } from './shared/utilities/utilities.module';
import { OperationalExpensesModule } from './modules/operational-expenses/operational-expenses.module';

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
    HealthModule, // Health checks for monitoring
    DashboardModule, // Survival feature: Cash flow dashboard
    PCCCModule, // PCCC compliance generator (PC17)
    DisputeModule, // UC_DISPUTE_01: Deposit dispute resolution
    AlertsModule, // UC_SEC_05: Critical event alerting system
    LegalInfrastructureModule, // UC_LEGAL_*: Legal-grade infrastructure (event sourcing, state machine, audit)
    eKycModule, // UC_AUTH_01: Identity verification (FPT.AI/VNPT)
    UtilitiesModule, // Global utilities (ContractHashService, etc.)
    OperationalExpensesModule,
    DocumentsModule,
  ],
  providers: [
    PrismaService,
    CacheService,
    CleanupService,
    LegalIntegrityCron, // ☠️ LEGAL: Daily integrity verification cron
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
