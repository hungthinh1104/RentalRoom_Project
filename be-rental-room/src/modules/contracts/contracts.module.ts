import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractSchedulerService } from './contract-scheduler.service';
import { ContractSigningService } from './services/contract-signing.service';
import { PdfQueueService } from './services/pdf-queue.service';
import { ContractPdfService } from './contract-pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from 'src/common/common.module';

import { PaymentsModule } from '../payments/payments.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    CommonModule,
    PaymentsModule,
    SnapshotsModule,
  ],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractSchedulerService,
    ContractSigningService,
    PdfQueueService,
    ContractPdfService,
    PrismaService,
  ],
  exports: [ContractsService, ContractSigningService],
})
export class ContractsModule {}
