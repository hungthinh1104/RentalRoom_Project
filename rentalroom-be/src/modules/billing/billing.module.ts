import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncomeModule } from '../income/income.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { BillingCronService, PdfService } from './services';

// Legal infrastructure
import { EventStoreService } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import { ImmutabilityGuard, IdempotencyGuard } from 'src/shared/guards/immutability.guard';
import { StateTransitionLogger } from 'src/shared/state-machines/transition-logger.service';

@Module({
  imports: [PrismaModule, NotificationsModule, IncomeModule, SnapshotsModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingCronService,
    PdfService,
    // Legal infrastructure
    EventStoreService,
    StateMachineGuard,
    ImmutabilityGuard,
    IdempotencyGuard,
    StateTransitionLogger,
  ],
  exports: [BillingService],
})
export class BillingModule {}
