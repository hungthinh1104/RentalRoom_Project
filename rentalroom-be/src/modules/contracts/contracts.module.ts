import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
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
import { ContractHashService } from './contract-hash.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from 'src/common/common.module';

import { PaymentsModule } from '../payments/payments.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

import { ContractApplicationService } from './applications/contract-application.service';
import { ContractLifecycleService } from './lifecycle/contract-lifecycle.service';

// Legal infrastructure
import { EventStoreService } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import { ImmutabilityGuard, IdempotencyGuard } from 'src/shared/guards/immutability.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
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
    ContractHashService,
    PrismaService,
    ContractApplicationService,
    ContractLifecycleService,
    // Legal infrastructure
    EventStoreService,
    StateMachineGuard,
    ImmutabilityGuard,
    IdempotencyGuard,
  ],
  exports: [
    ContractsService,
    ContractSigningService,
    ContractApplicationService,
    ContractLifecycleService,
    ContractHashService,
  ],
})
export class ContractsModule {}
