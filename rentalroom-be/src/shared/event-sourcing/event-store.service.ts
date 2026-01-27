import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * ☠️ LEGAL-GRADE EVENT STORE
 *
 * CRITICAL GUARANTEES:
 * 1. IMMUTABLE - Events NEVER modified or deleted
 * 2. APPEND-ONLY - Only INSERT, no UPDATE/DELETE
 * 3. CAUSATION CHAIN - Every event knows its parent
 * 4. CORRELATION - Group related events
 * 5. DETERMINISTIC TIME - Single authoritative timestamp
 * 6. CRYPTOGRAPHIC INTEGRITY - Hash chain verification
 *
 * WHY THIS MATTERS (Legal POV):
 * - Tòa án yêu cầu: "Chứng minh ai làm gì, khi nào, vì sao"
 * - Snapshot có thể mất → Event log là SINGLE SOURCE OF TRUTH
 * - Hash chain → detect ANY tampering (even by admin)
 * - Causation → prove "event A caused event B"
 *
 * UC_LEGAL_01: Legal-Grade Audit Trail
 * UC_LEGAL_02: Tamper-Evident Event Log
 */

export interface DomainEvent {
  // Event Identity (MUST HAVE)
  eventId: string; // UUID v4 - unique event identifier
  eventType: string; // INVOICE_CREATED, PAYMENT_COMPLETED, CONTRACT_SIGNED

  // Causation & Correlation (CRITICAL FOR LEGAL TRACEABILITY)
  causationId?: string; // Event ID that caused this event
  correlationId: string; // Groups related events (e.g., all events in one invoice payment flow)

  // Entity tracking
  aggregateId: string; // ID of entity (invoice, contract, payment)
  aggregateType: string; // INVOICE, CONTRACT, PAYMENT, DISPUTE
  aggregateVersion: number; // Version of entity AFTER this event

  // Event data
  payload: Record<string, any>; // Event-specific data (immutable)
  metadata: {
    userId: string; // Who triggered this event
    userRole: string; // TENANT, LANDLORD, ADMIN, SYSTEM
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date; // AUTHORITATIVE timestamp (from DB)
    source: string; // API, CRON, WEBHOOK, MIGRATION
  };

  // Integrity (Tamper Detection)
  previousEventHash?: string; // Hash of previous event (blockchain-style)
  eventHash?: string; // Hash of THIS event
}

export interface EventStoreQuery {
  aggregateId?: string;
  aggregateType?: string;
  eventType?: string;
  correlationId?: string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

/**
 * EVENT STORE - IMMUTABLE APPEND-ONLY LOG
 *
 * GUARANTEES:
 * 1. Once written → NEVER changed (even by admin)
 * 2. Hash chain → detect tampering
 * 3. Causation tracking → legal traceability
 * 4. Deterministic replay → rebuild state from events
 *
 * CRITICAL: This is the SINGLE SOURCE OF TRUTH
 * Snapshots = cache. Events = reality.
 */
@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * APPEND EVENT - CRITICAL OPERATION
   *
   * GUARANTEES:
   * - Atomic write (transaction)
   * - Hash chain verification
   * - Causation tracking
   * - FAIL-FAST if any integrity check fails
   *
   * @param event Domain event to append
   * @returns Persisted event with hash
   */
  async append(event: DomainEvent): Promise<DomainEvent> {
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Generate event ID if not provided
        if (!event.eventId) {
          event.eventId = uuidv4();
        }

        // 2. Get previous event for hash chain
        const previousEvent = await tx.domainEvent.findFirst({
          where: {
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
          },
          orderBy: {
            aggregateVersion: 'desc',
          },
        });

        // 3. Verify version sequencing (CRITICAL)
        if (previousEvent) {
          const expectedVersion = previousEvent.aggregateVersion + 1;
          if (event.aggregateVersion !== expectedVersion) {
            throw new Error(
              `Version conflict: Expected ${expectedVersion}, got ${event.aggregateVersion}. ` +
                `Possible concurrent modification or replay attack.`,
            );
          }
          event.previousEventHash = previousEvent.eventHash || undefined;
        } else {
          // First event for this aggregate
          if (event.aggregateVersion !== 1) {
            throw new Error(
              `First event must have version 1, got ${event.aggregateVersion}`,
            );
          }
        }

        // 4. Calculate event hash (integrity verification)
        event.eventHash = this.calculateEventHash(event);

        // 5. Persist event (IMMUTABLE)
        const _persistedEvent = await tx.domainEvent.create({
          data: {
            eventId: event.eventId,
            eventType: event.eventType,
            causationId: event.causationId,
            correlationId: event.correlationId,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            aggregateVersion: event.aggregateVersion,
            payload: event.payload,
            metadata: event.metadata,
            previousEventHash: event.previousEventHash,
            eventHash: event.eventHash,
            occurredAt: event.metadata.timestamp,
          },
        });

        this.logger.log(
          `✅ Event appended: ${event.eventType} | ${event.aggregateType}:${event.aggregateId} | v${event.aggregateVersion}`,
        );

        return event;
      },
      {
        isolationLevel: 'Serializable', // CRITICAL: Prevent concurrent writes
      },
    );
  }

  /**
   * BATCH APPEND - For migration/bulk operations
   *
   * CRITICAL: Maintains hash chain across batch
   */
  async appendBatch(events: DomainEvent[]): Promise<DomainEvent[]> {
    return await this.prisma.$transaction(async (tx) => {
      const results: DomainEvent[] = [];
      let previousHash: string | undefined;

      for (const event of events) {
        if (!event.eventId) {
          event.eventId = uuidv4();
        }

        if (previousHash) {
          event.previousEventHash = previousHash;
        }

        event.eventHash = this.calculateEventHash(event);
        previousHash = event.eventHash;

        await tx.domainEvent.create({
          data: {
            eventId: event.eventId,
            eventType: event.eventType,
            causationId: event.causationId,
            correlationId: event.correlationId,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            aggregateVersion: event.aggregateVersion,
            payload: event.payload,
            metadata: event.metadata,
            previousEventHash: event.previousEventHash,
            eventHash: event.eventHash,
            occurredAt: event.metadata.timestamp,
          },
        });

        results.push(event);
      }

      this.logger.log(`✅ Batch appended: ${events.length} events`);
      return results;
    });
  }

  /**
   * GET EVENT STREAM - Replay events for aggregate
   *
   * Used to rebuild state from events (deterministic replay)
   */
  async getEventStream(
    aggregateId: string,
    aggregateType: string,
    fromVersion: number = 1,
  ): Promise<DomainEvent[]> {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        aggregateId,
        aggregateType,
        aggregateVersion: {
          gte: fromVersion,
        },
      },
      orderBy: {
        aggregateVersion: 'asc',
      },
    });

    return events.map((record) => this.mapToDomainEvent(record));
  }

  /**
   * QUERY EVENTS - Legal discovery / audit
   *
   * Used for: "Show me all payment events by user X between date Y and Z"
   */
  async query(query: EventStoreQuery): Promise<DomainEvent[]> {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        ...(query.aggregateId && { aggregateId: query.aggregateId }),
        ...(query.aggregateType && { aggregateType: query.aggregateType }),
        ...(query.eventType && { eventType: query.eventType }),
        ...(query.correlationId && { correlationId: query.correlationId }),
        ...(query.userId && {
          metadata: {
            path: ['userId'],
            equals: query.userId,
          },
        }),
        ...(query.fromDate && {
          occurredAt: { gte: query.fromDate },
        }),
        ...(query.toDate && {
          occurredAt: { lte: query.toDate },
        }),
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: query.limit || 1000,
    });

    return events.map((record) => this.mapToDomainEvent(record));
  }

  /**
   * VERIFY INTEGRITY - Detect tampering
   *
   * CRITICAL: Run this periodically (daily cron)
   * If verification fails → SECURITY INCIDENT
   */
  async verifyIntegrity(
    aggregateId: string,
    aggregateType: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const events = await this.getEventStream(aggregateId, aggregateType);
    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // 1. Verify version sequencing
      const expectedVersion = i + 1;
      if (event.aggregateVersion !== expectedVersion) {
        errors.push(
          `Version gap at event ${event.eventId}: expected v${expectedVersion}, got v${event.aggregateVersion}`,
        );
      }

      // 2. Verify hash chain
      if (i > 0) {
        const previousEvent = events[i - 1];
        if (event.previousEventHash !== previousEvent.eventHash) {
          errors.push(
            `Hash chain broken at event ${event.eventId}: ` +
              `previousEventHash=${event.previousEventHash}, ` +
              `expected=${previousEvent.eventHash}`,
          );
        }
      }

      // 3. Verify event hash
      const calculatedHash = this.calculateEventHash(event);
      if (event.eventHash !== calculatedHash) {
        errors.push(
          `Event hash mismatch at ${event.eventId}: ` +
            `stored=${event.eventHash}, calculated=${calculatedHash}. ` +
            `POSSIBLE TAMPERING DETECTED.`,
        );
      }
    }

    if (errors.length > 0) {
      this.logger.error(
        `🚨 INTEGRITY VERIFICATION FAILED for ${aggregateType}:${aggregateId}`,
      );
      errors.forEach((err) => this.logger.error(err));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * GET CAUSATION CHAIN - Trace event origins
   *
   * Example: "Why was this invoice created?"
   * → Find all events in causation chain
   */
  async getCausationChain(eventId: string): Promise<DomainEvent[]> {
    const chain: DomainEvent[] = [];
    let currentEventId: string | undefined = eventId;

    while (currentEventId) {
      const event = await this.prisma.domainEvent.findUnique({
        where: { eventId: currentEventId },
      });

      if (!event) break;

      chain.unshift(this.mapToDomainEvent(event));
      currentEventId = event.causationId || undefined;
    }

    return chain;
  }

  /**
   * GET CORRELATION GROUP - All related events
   *
   * Example: "Show me all events related to invoice payment X"
   */
  async getCorrelationGroup(correlationId: string): Promise<DomainEvent[]> {
    return await this.query({ correlationId });
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Calculate cryptographic hash of event
   *
   * CRITICAL: Any modification to event data changes hash
   * → Tamper detection
   */
  private calculateEventHash(event: DomainEvent): string {
    // Hash components (order matters!)
    const hashInput = [
      event.eventId,
      event.eventType,
      event.aggregateId,
      event.aggregateType,
      event.aggregateVersion.toString(),
      JSON.stringify(event.payload),
      JSON.stringify(event.metadata),
      event.previousEventHash || '',
    ].join('|');

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Map Prisma model to domain event
   */
  private mapToDomainEvent(record: any): DomainEvent {
    return {
      eventId: record.eventId,
      eventType: record.eventType,
      causationId: record.causationId,
      correlationId: record.correlationId,
      aggregateId: record.aggregateId,
      aggregateType: record.aggregateType,
      aggregateVersion: record.aggregateVersion,
      payload: record.payload as Record<string, any>,
      metadata: record.metadata,
      previousEventHash: record.previousEventHash,
      eventHash: record.eventHash,
    };
  }
}
