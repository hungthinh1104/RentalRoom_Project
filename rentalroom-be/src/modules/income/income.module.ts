import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { ExpenseService, TaxYearSummaryService } from './services';
import { IncomeController } from './income.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SnapshotsModule],
  controllers: [IncomeController],
  providers: [IncomeService, ExpenseService, TaxYearSummaryService],
  exports: [IncomeService, ExpenseService, TaxYearSummaryService],
})
export class IncomeModule {}
