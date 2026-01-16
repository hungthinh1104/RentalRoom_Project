import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AdminReportService } from './services/admin-report.service';
import { LandlordReportService } from './services/landlord-report.service';
import { TenantReportService } from './services/tenant-report.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 60 * 5, // 5 minutes cache
      max: 100,
    }),
  ],
  providers: [AdminReportService, LandlordReportService, TenantReportService],
  controllers: [ReportsController],
  exports: [AdminReportService, LandlordReportService, TenantReportService],
})
export class ReportsModule {}
