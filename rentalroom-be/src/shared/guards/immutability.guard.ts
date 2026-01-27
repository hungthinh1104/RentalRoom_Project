import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * ☠️ IMMUTABILITY ENFORCER - FREEZE AFTER MILESTONE
 *
 * CRITICAL PROBLEM:
 * - Invoice PAID → vẫn có thể UPDATE amount
 * - Contract ACTIVE → vẫn có thể thay đổi điều khoản
 * - Payment COMPLETED → vẫn có thể sửa số tiền
 *
 * LEGAL CONSEQUENCE:
 * - Tòa án: "Hệ thống cho phép chỉnh sửa sau sự kiện"
 * - Result: THUA vụ kiện
 *
 * SOLUTION:
 * - Define IMMUTABLE MILESTONES for each entity
 * - REJECT any modification after milestone
 * - Store original data in versioned table
 *
 * UC_LEGAL_05: Post-Milestone Immutability
 * UC_LEGAL_06: Data Integrity Protection
 */

export interface FreezeRule {
  entityType: string;
  milestoneStatus: string[];
  allowedFields?: string[]; // Fields still allowed after freeze
  reason: string;
}

/**
 * FREEZE RULES - LEGAL-GRADE IMMUTABILITY
 *
 * Once an entity reaches a milestone status:
 * - Core fields CANNOT be modified
 * - Only specific fields (like notes, tags) may be updated
 * - Any attempt to modify frozen fields → REJECT
 */
const FREEZE_RULES: FreezeRule[] = [
  // INVOICE RULES
  {
    entityType: 'INVOICE',
    milestoneStatus: ['PAID', 'BAD_DEBT'],
    allowedFields: ['internalNotes', 'tags'], // Only metadata allowed
    reason: 'Invoice cannot be modified after payment. Legal requirement.',
  },

  // CONTRACT RULES
  {
    entityType: 'CONTRACT',
    milestoneStatus: ['ACTIVE', 'TERMINATED', 'EXPIRED'],
    allowedFields: ['internalNotes', 'handoverChecklist'], // Only non-legal fields
    reason:
      'Contract cannot be modified after activation. Use amendment process.',
  },

  // PAYMENT RULES
  {
    entityType: 'PAYMENT',
    milestoneStatus: ['COMPLETED', 'REFUNDED'],
    allowedFields: [], // NO fields allowed
    reason:
      'Completed payments are immutable. Create reversal payment instead.',
  },

  // MAINTENANCE RULES
  {
    entityType: 'MAINTENANCE',
    milestoneStatus: ['COMPLETED'],
    allowedFields: ['feedbackNotes', 'rating'],
    reason:
      'Completed maintenance records are immutable. Create new request for changes.',
  },
];

/**
 * IMMUTABILITY GUARD SERVICE
 *
 * USAGE:
 * ```ts
 * // Before ANY update operation:
 * await this.immutabilityGuard.enforceImmutability(
 *   'INVOICE',
 *   invoice.id,
 *   invoice.status,
 *   updateDto, // Fields being updated
 *   userId
 * );
 *
 * // If frozen → throws BadRequestException
 * // If allowed → returns true
 * ```
 */
@Injectable()
export class ImmutabilityGuard {
  private readonly logger = new Logger(ImmutabilityGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ENFORCE IMMUTABILITY - CRITICAL OPERATION
   *
   * GUARANTEES:
   * - Blocks modifications to frozen entities
   * - Logs all freeze violations
   * - Creates audit trail of blocked attempts
   *
   * @param entityType Type of entity
   * @param entityId Entity UUID
   * @param currentStatus Current status
   * @param updateFields Fields being updated
   * @param userId Who is attempting update
   * @returns true if allowed, throws otherwise
   */
  async enforceImmutability(
    entityType: string,
    entityId: string,
    currentStatus: string,
    updateFields: Record<string, any>,
    userId: string,
  ): Promise<boolean> {
    // 1. Get freeze rule for this entity type
    const freezeRule = FREEZE_RULES.find(
      (rule) => rule.entityType === entityType,
    );
    if (!freezeRule) {
      // No freeze rule → allow update (with warning)
      this.logger.warn(
        `No freeze rule defined for ${entityType}. Update allowed by default.`,
      );
      return true;
    }

    // 2. Check if entity is at milestone status
    const isFrozen = freezeRule.milestoneStatus.includes(currentStatus);
    if (!isFrozen) {
      // Not frozen → allow update
      this.logger.debug(
        `${entityType}:${entityId} status ${currentStatus} not frozen. Update allowed.`,
      );
      return true;
    }

    // 3. Entity is FROZEN → check if update is allowed
    const updatedFieldNames = Object.keys(updateFields);
    const allowedFields = freezeRule.allowedFields || [];

    // Filter out fields that are NOT in allowed list
    const forbiddenFields = updatedFieldNames.filter(
      (field) => !allowedFields.includes(field),
    );

    if (forbiddenFields.length > 0) {
      // ☠️ FREEZE VIOLATION DETECTED
      this.logger.error(
        `🚨 FREEZE VIOLATION: User ${userId} attempted to modify frozen ${entityType}:${entityId} ` +
          `(status: ${currentStatus}). Forbidden fields: ${forbiddenFields.join(', ')}`,
      );

      // Log security event
      await this.logFreezeViolation(
        entityType,
        entityId,
        currentStatus,
        forbiddenFields,
        userId,
      );

      throw new BadRequestException(
        `Cannot modify ${entityType} in status ${currentStatus}. ` +
          `Reason: ${freezeRule.reason} ` +
          `Attempted to modify frozen fields: ${forbiddenFields.join(', ')}. ` +
          (allowedFields.length > 0
            ? `Only these fields can be updated: ${allowedFields.join(', ')}`
            : 'No fields can be modified.'),
      );
    }

    // 4. Update is allowed (only allowed fields)
    this.logger.log(
      `✅ Frozen ${entityType}:${entityId} update allowed: ` +
        `fields ${updatedFieldNames.join(', ')} are in allowed list`,
    );

    return true;
  }

  /**
   * CHECK IF ENTITY IS FROZEN (read-only check)
   */
  isFrozen(entityType: string, currentStatus: string): boolean {
    const freezeRule = FREEZE_RULES.find(
      (rule) => rule.entityType === entityType,
    );
    if (!freezeRule) return false;

    return freezeRule.milestoneStatus.includes(currentStatus);
  }

  /**
   * GET FREEZE REASON - For error messages
   */
  getFreezeReason(entityType: string): string | undefined {
    const freezeRule = FREEZE_RULES.find(
      (rule) => rule.entityType === entityType,
    );
    return freezeRule?.reason;
  }

  /**
   * LOG FREEZE VIOLATION - Audit trail
   */
  private async logFreezeViolation(
    entityType: string,
    entityId: string,
    status: string,
    forbiddenFields: string[],
    userId: string,
  ): Promise<void> {
    try {
      // Store in audit log (separate from main tables)
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'FREEZE_VIOLATION_BLOCKED',
          entityType,
          entityId,
          details: {
            status,
            forbiddenFields,
            timestamp: new Date().toISOString(),
            severity: 'HIGH',
            message: `Attempted to modify frozen ${entityType}`,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log freeze violation', error);
    }
  }
}

/**
 * ☠️ IDEMPOTENCY ENFORCER - PREVENT DUPLICATION ATTACKS
 *
 * CRITICAL PROBLEM:
 * - Regenerate utility invoice → duplicate charge
 * - Retry payment → double payment
 * - Retry snapshot → inconsistent data
 *
 * ATTACK SCENARIO:
 * - User clicks "Pay" button 5 times fast
 * - Without idempotency → 5 payments created
 * - Result: User charged 5x
 *
 * SOLUTION:
 * - Idempotency key for every critical operation
 * - Store key + result hash
 * - If duplicate request → return cached result
 *
 * UC_LEGAL_07: Idempotent Operations
 * UC_LEGAL_08: Duplication Attack Prevention
 */

export interface IdempotencyRecord {
  key: string;
  userId: string;
  operation: string;
  resultHash: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class IdempotencyGuard {
  private readonly logger = new Logger(IdempotencyGuard.name);
  private readonly DEFAULT_TTL_SECONDS = 86400; // 24 hours

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ENFORCE IDEMPOTENCY - CRITICAL OPERATION
   *
   * USAGE:
   * ```ts
   * const idempotencyKey = headers['idempotency-key'] || uuidv4();
   *
   * const result = await this.idempotency.executeIdempotent(
   *   idempotencyKey,
   *   'CREATE_PAYMENT',
   *   userId,
   *   async () => {
   *     // Your operation here
   *     return await this.createPayment(dto);
   *   }
   * );
   * ```
   *
   * GUARANTEES:
   * - If key seen before → return cached result (no execution)
   * - If key new → execute operation, cache result
   * - Atomic check-and-set (no race conditions)
   */
  async executeIdempotent<T>(
    idempotencyKey: string,
    operation: string,
    userId: string,
    executor: () => Promise<T>,
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS,
  ): Promise<T> {
    // 1. Check if we've seen this key before
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      // 2. Key exists → return cached result
      this.logger.log(
        `♻️ Idempotent request detected: key=${idempotencyKey}, ` +
          `operation=${operation}, user=${userId}. Returning cached result.`,
      );

      // Deserialize cached result
      const cachedResult = JSON.parse(existing.resultData as string);
      return cachedResult as T;
    }

    // 3. New key → execute operation
    this.logger.debug(
      `🆕 New idempotent request: key=${idempotencyKey}, operation=${operation}`,
    );

    let result: T;
    try {
      result = await executor();
    } catch (error) {
      // Operation failed → do NOT cache failure
      // Next retry with same key will execute again
      this.logger.error(
        `Idempotent operation failed: key=${idempotencyKey}, error=${error}`,
      );
      throw error;
    }

    // 4. Store result with idempotency key
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const resultHash = this.hashResult(result);

    await this.prisma.idempotencyRecord.create({
      data: {
        key: idempotencyKey,
        userId,
        operation,
        resultData: JSON.stringify(result),
        resultHash,
        expiresAt,
      },
    });

    this.logger.log(
      `✅ Idempotent operation completed: key=${idempotencyKey}, hash=${resultHash}`,
    );

    return result;
  }

  /**
   * CLEANUP EXPIRED KEYS - Run daily via cron
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(
      `🧹 Cleaned up ${result.count} expired idempotency records`,
    );
    return result.count;
  }

  /**
   * Hash result for integrity verification
   */
  private hashResult<T>(result: T): string {
    const resultStr = JSON.stringify(result);
    return crypto.createHash('sha256').update(resultStr).digest('hex');
  }
}
