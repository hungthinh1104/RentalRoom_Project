import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { validateTransition } from './transitions';

/**
 * State Transition Logger
 * Logs all entity status transitions for audit trail and debugging
 *
 * Usage:
 * ```typescript
 * await this.stateLogger.logTransition({
 *   entityType: 'invoice',
 *   entityId: invoiceId,
 *   oldStatus: 'PENDING',
 *   newStatus: 'PAID',
 *   actorId: userId,
 *   actorRole: 'TENANT',
 *   reason: 'Payment received via bank transfer',
 * });
 * ```
 */
@Injectable()
export class StateTransitionLogger {
  private readonly logger = new Logger(StateTransitionLogger.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a state transition with full audit trail
   * Validates transition is legal before logging
   */
  logTransition(dto: {
    entityType: 'invoice' | 'maintenance' | 'dispute' | 'contract';
    entityId: string;
    oldStatus: string;
    newStatus: string;
    actorId?: string;
    actorRole?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): void {
    const {
      entityType,
      oldStatus,
      newStatus,
      entityId,
      actorId,
      actorRole,
      reason,
      metadata: _metadata,
    } = dto;

    try {
      // Validate transition is legal
      validateTransition(entityType, oldStatus, newStatus);

      // Log to console with structured format
      this.logger.log({
        message: `State transition`,
        entityType,
        entityId: entityId.substring(0, 8) + '...',
        transition: `${oldStatus} → ${newStatus}`,
        actor: actorId
          ? `${actorRole}:${actorId.substring(0, 8)}...`
          : 'SYSTEM',
        reason,
        timestamp: new Date().toISOString(),
      });

      // Optional: Store in database audit log (if audit table exists)
      // await this.prisma.audit.create({
      //   data: {
      //     entityType,
      //     entityId,
      //     action: 'STATE_TRANSITION',
      //     oldValue: oldStatus,
      //     newValue: newStatus,
      //     actorId,
      //     actorRole,
      //     metadata,
      //     createdAt: new Date(),
      //   },
      // });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Invalid state transition: ${entityType}.${oldStatus} → ${newStatus}: ${msg}`,
        error,
      );
      throw error; // Re-throw to fail the operation
    }
  }

  /**
   * Shorthand: Log transition without throwing (for soft failures)
   * Useful for background jobs that shouldn't crash
   */
  logTransitionSafe(dto: any): void {
    try {
      this.logTransition(dto);
    } catch (error) {
      this.logger.warn(`Failed to log transition: ${error}`);
      // Don't re-throw—allow operation to continue
    }
  }
}
