import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { HttpModule } from '@nestjs/axios';
import { SepayService } from './sepay.service';
import { PaymentCronService } from './payment-cron.service';
import { EncryptionService } from 'src/common/services/encryption.service';

// New payment architecture (Phase A refactoring)
import { SepayAdapter } from './adapters';
import { PaymentGatewayFactory } from './factories';
import { PaymentService } from './payment.service';

// Legal infrastructure
import { EventStoreService } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import {
  ImmutabilityGuard,
  IdempotencyGuard,
} from 'src/shared/guards/immutability.guard';

@Module({
  imports: [HttpModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PrismaService,
    SepayService, // @deprecated - Use PaymentService instead
    PaymentCronService,
    EncryptionService,

    // New payment architecture
    SepayAdapter,
    PaymentGatewayFactory,
    PaymentService,

    // Legal infrastructure
    EventStoreService,
    StateMachineGuard,
    ImmutabilityGuard,
    IdempotencyGuard,
  ],
  exports: [
    PaymentsService,
    SepayService, // @deprecated
    PaymentService, // New facade service
  ],
})
export class PaymentsModule {}
