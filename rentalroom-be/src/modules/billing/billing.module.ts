import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncomeModule } from '../income/income.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { BillingCronService, PdfService } from './services';

@Module({
  imports: [PrismaModule, NotificationsModule, IncomeModule, SnapshotsModule],
  controllers: [BillingController],
  providers: [BillingService, BillingCronService, PdfService],
  exports: [BillingService],
})
export class BillingModule {}
