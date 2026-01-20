/**
 * State Machine Transitions Validator
 * Defines and enforces valid status transitions for all entities
 *
 * Purpose:
 * - Prevent invalid state changes (e.g., PAID → PENDING)
 * - Log all transitions for audit trail
 * - Catch logical errors at business logic layer
 */

export enum InvoiceTransition {
  // PENDING → PAID (normal flow)
  INVOICE_PAID = 'INVOICE_PAID',
  // PENDING → OVERDUE (auto-calculated by deadline)
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  // PAID/OVERDUE → PENDING (reversal, rare)
  INVOICE_UNPAID = 'INVOICE_UNPAID',
  // Any → deleted (soft delete)
  INVOICE_DELETED = 'INVOICE_DELETED',
}

export enum MaintenanceTransition {
  // PENDING → IN_PROGRESS (landlord accepts)
  MAINTENANCE_START = 'MAINTENANCE_START',
  // IN_PROGRESS → COMPLETED (work done)
  MAINTENANCE_COMPLETE = 'MAINTENANCE_COMPLETE',
  // Any → CANCELLED (landlord cancels)
  MAINTENANCE_CANCEL = 'MAINTENANCE_CANCEL',
}

export enum DisputeTransition {
  // OPEN → APPROVED/REJECTED/PARTIAL (admin resolves)
  DISPUTE_RESOLVE = 'DISPUTE_RESOLVE',
  // OPEN → ESCALATED (manual escalation)
  DISPUTE_ESCALATE = 'DISPUTE_ESCALATE',
  // Any → ESCALATED (auto-escalate if both submit evidence)
  DISPUTE_AUTO_ESCALATE = 'DISPUTE_AUTO_ESCALATE',
}

/**
 * Valid state transitions for each entity type
 * Format: From State → [To States]
 */
export const VALID_TRANSITIONS = {
  // Invoice states: PENDING | PAID | OVERDUE
  invoice: {
    PENDING: ['PAID', 'OVERDUE'],
    PAID: ['PENDING'], // Allow reversal for audit/correction
    OVERDUE: ['PAID'],
  },

  // Maintenance states: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  maintenance: {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal
    CANCELLED: [], // Terminal
  },

  // Dispute states: OPEN | APPROVED | REJECTED | PARTIAL | ESCALATED
  dispute: {
    OPEN: ['APPROVED', 'REJECTED', 'PARTIAL', 'ESCALATED'],
    APPROVED: [], // Terminal
    REJECTED: [], // Terminal
    PARTIAL: [], // Terminal
    ESCALATED: [], // Manual offline handling
  },

  // Contract states handled in contract-lifecycle.service
  contract: {
    DRAFT: ['PENDING_SIGNATURE', 'CANCELLED'],
    PENDING_SIGNATURE: ['DEPOSIT_PENDING', 'CANCELLED'],
    DEPOSIT_PENDING: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    ACTIVE: ['TERMINATED', 'EXPIRED'],
    TERMINATED: [], // Terminal
    EXPIRED: ['ACTIVE'], // Allow renewal (extend)
    CANCELLED: [], // Terminal
  },
};

/**
 * Validate transition from oldStatus to newStatus
 * @throws Error if transition is invalid
 */
export function validateTransition(
  entityType: 'invoice' | 'maintenance' | 'dispute' | 'contract',
  oldStatus: string,
  newStatus: string,
): void {
  const transitions = VALID_TRANSITIONS[entityType];

  if (!transitions) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const allowedStates = (transitions as any)[oldStatus];

  if (!allowedStates) {
    throw new Error(
      `Unknown status for ${entityType}: ${oldStatus}`,
    );
  }

  if (!allowedStates.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${entityType}.${oldStatus} → ${newStatus}. ` +
      `Allowed: ${allowedStates.join(', ') || 'none (terminal state)'}`,
    );
  }
}

/**
 * Get allowed transitions from a status
 */
export function getAllowedTransitions(
  entityType: 'invoice' | 'maintenance' | 'dispute' | 'contract',
  status: string,
): string[] {
  const transitions = VALID_TRANSITIONS[entityType];
  if (!transitions) return [];
  return (transitions as any)[status] || [];
}
