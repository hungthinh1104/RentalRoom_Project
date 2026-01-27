import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma/prisma.service';

// Services
import { EventStoreService } from './event-sourcing/event-store.service';
import { StateMachineGuard } from './state-machine/state-machine.guard';
import {
  ImmutabilityGuard,
  IdempotencyGuard,
} from './guards/immutability.guard';
import { AdminAuditService } from './audit/admin-audit.service';
import { StateTransitionLogger } from './state-machines/transition-logger.service';
import { CronClusterGuard } from './guards/cron-cluster.guard';

/**
 * ☠️ LEGAL-GRADE INFRASTRUCTURE MODULE
 *
 * Provides:
 * 1. Event Store - Immutable event log (single source of truth)
 * 2. State Machine Guards - Prevent illegal transitions
 * 3. Immutability Guards - Freeze after milestone
 * 4. Idempotency Guards - Prevent duplication attacks
 * 5. Admin Audit Trail - Track god-mode actions
 *
 * CRITICAL: These services MUST be used in every critical operation
 *
 * @Global - Available across entire application
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    EventStoreService,
    StateMachineGuard,
    ImmutabilityGuard,
    IdempotencyGuard,
    AdminAuditService,
    StateTransitionLogger,
    CronClusterGuard,
  ],
  exports: [
    EventStoreService,
    StateMachineGuard,
    ImmutabilityGuard,
    IdempotencyGuard,
    AdminAuditService,
    StateTransitionLogger,
    CronClusterGuard,
  ],
})
export class LegalInfrastructureModule { }
