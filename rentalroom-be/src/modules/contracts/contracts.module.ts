import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ContractsController } from './contracts.controller';
import { ContractTemplatesController } from './controllers/contract-templates.controller';
import { ContractsService } from './contracts.service';
import { ContractSchedulerService } from './shared';
import {
  ContractSigningService,
  PdfQueueService,
  ContractPdfService,
} from './signing';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from 'src/common/common.module';

import { PaymentsModule } from '../payments/payments.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

import { ContractApplicationService } from './applications/contract-application.service';
import { ContractLifecycleService } from './lifecycle/contract-lifecycle.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    CommonModule,
    PaymentsModule,
    SnapshotsModule,
  ],
  controllers: [ContractsController, ContractTemplatesController],
  providers: [
    ContractsService,
    ContractSchedulerService,
    ContractSigningService,
    PdfQueueService,
    ContractPdfService,
    PrismaService,
    ContractApplicationService,
    ContractLifecycleService,
  ],
  exports: [
    ContractsService,
    ContractSigningService,
    ContractApplicationService,
    ContractLifecycleService,
  ],
})
export class ContractsModule {}
