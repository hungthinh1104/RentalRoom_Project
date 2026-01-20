import { Injectable, BadRequestException, Logger } from '@nestjs/common';

/**
 * ☠️ STATE MACHINE GUARD - PREVENT ILLEGAL TRANSITIONS
 * 
 * CRITICAL PROBLEM:
 * - Hiện tại: Cho phép PAID → UPDATE, TERMINATED → UPDATE
 * - Hậu quả: Tạo ra trạng thái KHÔNG TỒN TẠI trong đời thực
 * - Pháp lý: "Unreliable System of Record"
 * 
 * SOLUTION:
 * - Define EXPLICIT transitions cho mỗi entity type
 * - REJECT any transition không được phép
 * - AUDIT mọi transition attempt (kể cả fail)
 * 
 * UC_LEGAL_03: State Machine Integrity
 * UC_LEGAL_04: Illegal Transition Prevention
 */

export enum InvoiceState {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  BAD_DEBT = 'BAD_DEBT',
}

export enum ContractState {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  DEPOSIT_PENDING = 'DEPOSIT_PENDING',
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentState {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum MaintenanceState {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * STATE MACHINE DEFINITIONS
 * 
 * Format: { fromState: [allowedToStates] }
 * 
 * CRITICAL RULE:
 * If a transition is NOT in this map → IT IS FORBIDDEN
 */
const INVOICE_TRANSITIONS: Record<InvoiceState, InvoiceState[]> = {
  [InvoiceState.DRAFT]: [InvoiceState.PENDING, InvoiceState.CANCELLED],
  [InvoiceState.PENDING]: [InvoiceState.PAID, InvoiceState.OVERDUE, InvoiceState.CANCELLED],
  [InvoiceState.OVERDUE]: [InvoiceState.PAID, InvoiceState.BAD_DEBT],
  [InvoiceState.PAID]: [], // ☠️ TERMINAL STATE - CANNOT CHANGE
  [InvoiceState.CANCELLED]: [], // ☠️ TERMINAL STATE
  [InvoiceState.BAD_DEBT]: [], // ☠️ TERMINAL STATE
};

const CONTRACT_TRANSITIONS: Record<ContractState, ContractState[]> = {
  [ContractState.DRAFT]: [ContractState.PENDING_SIGNATURE, ContractState.CANCELLED],
  [ContractState.PENDING_SIGNATURE]: [ContractState.DEPOSIT_PENDING, ContractState.CANCELLED],
  [ContractState.DEPOSIT_PENDING]: [ContractState.ACTIVE, ContractState.CANCELLED],
  [ContractState.ACTIVE]: [ContractState.TERMINATED, ContractState.EXPIRED],
  [ContractState.TERMINATED]: [], // ☠️ TERMINAL STATE
  [ContractState.EXPIRED]: [], // ☠️ TERMINAL STATE
  [ContractState.CANCELLED]: [], // ☠️ TERMINAL STATE
};

const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  [PaymentState.PENDING]: [PaymentState.COMPLETED, PaymentState.FAILED],
  [PaymentState.COMPLETED]: [PaymentState.REFUNDED], // Only allow refund after completion
  [PaymentState.FAILED]: [PaymentState.PENDING], // Allow retry
  [PaymentState.REFUNDED]: [], // ☠️ TERMINAL STATE
};

const MAINTENANCE_TRANSITIONS: Record<MaintenanceState, MaintenanceState[]> = {
  [MaintenanceState.PENDING]: [MaintenanceState.IN_PROGRESS, MaintenanceState.CANCELLED],
  [MaintenanceState.IN_PROGRESS]: [MaintenanceState.COMPLETED, MaintenanceState.CANCELLED],
  [MaintenanceState.COMPLETED]: [], // ☠️ TERMINAL STATE
  [MaintenanceState.CANCELLED]: [], // ☠️ TERMINAL STATE
};

/**
 * STATE MACHINE GUARD SERVICE
 * 
 * USAGE:
 * ```ts
 * // Before any state change:
 * await this.stateMachine.validateTransition(
 *   'INVOICE',
 *   invoice.id,
 *   invoice.status,
 *   'PAID',
 *   userId
 * );
 * 
 * // If invalid → throws BadRequestException
 * // If valid → returns true, logs audit
 * ```
 */
@Injectable()
export class StateMachineGuard {
  private readonly logger = new Logger(StateMachineGuard.name);

  private readonly transitions = {
    INVOICE: INVOICE_TRANSITIONS,
    CONTRACT: CONTRACT_TRANSITIONS,
    PAYMENT: PAYMENT_TRANSITIONS,
    MAINTENANCE: MAINTENANCE_TRANSITIONS,
  };

  /**
   * VALIDATE TRANSITION - CRITICAL OPERATION
   * 
   * GUARANTEES:
   * - Rejects illegal transitions
   * - Logs all attempts (for audit)
   * - Throws exception with clear error message
   * 
   * @param entityType Type of entity (INVOICE, CONTRACT, etc)
   * @param entityId Entity UUID
   * @param fromState Current state
   * @param toState Desired state
   * @param userId Who is attempting transition
   * @param reason Optional reason for transition
   * @returns true if valid, throws otherwise
   */
  validateTransition(
    entityType: 'INVOICE' | 'CONTRACT' | 'PAYMENT' | 'MAINTENANCE',
    entityId: string,
    fromState: string,
    toState: string,
    userId: string,
    reason?: string,
  ): boolean {
    // 1. Get state machine for this entity type
    const stateMachine = this.transitions[entityType];
    if (!stateMachine) {
      throw new BadRequestException(
        `Unknown entity type: ${entityType}. Cannot validate transition.`,
      );
    }

    // 2. Same state → no-op (but log it)
    if (fromState === toState) {
      this.logger.debug(
        `No-op transition: ${entityType}:${entityId} ${fromState} → ${toState} by ${userId}`,
      );
      return true;
    }

    // 3. Get allowed transitions from current state
    const allowedTransitions = stateMachine[fromState as any];
    if (!allowedTransitions) {
      // State not in state machine → CRITICAL ERROR
      this.logger.error(
        `🚨 INVALID STATE DETECTED: ${entityType}:${entityId} is in unknown state "${fromState}"`,
      );
      throw new BadRequestException(
        `Entity ${entityType}:${entityId} is in invalid state: ${fromState}. ` +
        `This is a data integrity issue. Contact support.`,
      );
    }

    // 4. Check if transition is allowed
    const isAllowed = allowedTransitions.includes(toState as any);

    if (!isAllowed) {
      // ☠️ ILLEGAL TRANSITION DETECTED
      this.logger.warn(
        `❌ ILLEGAL TRANSITION BLOCKED: ${entityType}:${entityId} ` +
        `${fromState} → ${toState} by user ${userId}. ` +
        `Reason: ${reason || 'Not provided'}`,
      );

      throw new BadRequestException(
        `Cannot transition ${entityType} from ${fromState} to ${toState}. ` +
        `Allowed transitions from ${fromState}: ${allowedTransitions.join(', ')}`,
      );
    }

    // 5. Transition is valid → log and allow
    this.logger.log(
      `✅ Valid transition: ${entityType}:${entityId} ${fromState} → ${toState} by ${userId}`,
    );

    return true;
  }

  /**
   * CHECK IF STATE IS TERMINAL (cannot be changed)
   * 
   * Use this before allowing ANY update:
   * ```ts
   * if (this.stateMachine.isTerminalState('INVOICE', invoice.status)) {
   *   throw new BadRequestException('Invoice is in terminal state, cannot modify');
   * }
   * ```
   */
  isTerminalState(
    entityType: 'INVOICE' | 'CONTRACT' | 'PAYMENT' | 'MAINTENANCE',
    state: string,
  ): boolean {
    const stateMachine = this.transitions[entityType];
    if (!stateMachine) return false;

    const allowedTransitions = stateMachine[state as any];
    return allowedTransitions ? allowedTransitions.length === 0 : false;
  }

  /**
   * GET ALLOWED TRANSITIONS - For UI
   * 
   * Example: Show user only the valid next states
   */
  getAllowedTransitions(
    entityType: 'INVOICE' | 'CONTRACT' | 'PAYMENT' | 'MAINTENANCE',
    currentState: string,
  ): string[] {
    const stateMachine = this.transitions[entityType];
    if (!stateMachine) return [];

    return stateMachine[currentState as any] || [];
  }

  /**
   * VALIDATE STATE EXISTS - For data integrity checks
   */
  isValidState(
    entityType: 'INVOICE' | 'CONTRACT' | 'PAYMENT' | 'MAINTENANCE',
    state: string,
  ): boolean {
    const stateMachine = this.transitions[entityType];
    if (!stateMachine) return false;

    return state in stateMachine;
  }
}
