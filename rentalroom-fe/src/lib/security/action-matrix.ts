'use client';

/**
 * 🔒 STATE × ACTION MATRIX
 *
 * Defines which actions are legal for each entity state.
 * UI MUST check this before rendering action buttons.
 *
 * This prevents:
 * - Showing "Approve" on terminated contracts
 * - Showing "Resolve" on closed disputes
 * - Showing "Pay" on already paid invoices
 */

// Contract State Machine
export const CONTRACT_ACTION_MATRIX: Record<
    string,
    { allowed: string[]; forbidden: string[]; reason?: string }
> = {
    DRAFT: {
        allowed: ['send', 'update', 'delete', 'requestChanges'],
        forbidden: ['approve', 'terminate', 'renew', 'generateInvoice'],
    },
    PENDING_SIGNATURE: {
        allowed: ['tenantApprove', 'revoke', 'requestChanges'],
        forbidden: ['update', 'delete', 'terminate', 'generateInvoice'],
        reason: 'Chờ tenant ký - không được sửa đổi',
    },
    DEPOSIT_PENDING: {
        allowed: ['verifyPayment', 'terminate'],
        forbidden: ['update', 'delete', 'generateInvoice', 'renew'],
        reason: 'Chờ đặt cọc - hợp đồng bị khóa',
    },
    ACTIVE: {
        allowed: ['generateInvoice', 'addResident', 'removeResident', 'terminate', 'renew'],
        forbidden: ['update', 'delete', 'approve'],
        reason: 'Hợp đồng đang hiệu lực',
    },
    TERMINATED: {
        allowed: ['viewAudit'],
        forbidden: ['update', 'delete', 'generateInvoice', 'addResident', 'renew'],
        reason: '⚠️ Hợp đồng đã chấm dứt - chỉ xem',
    },
    EXPIRED: {
        allowed: ['renew', 'viewAudit'],
        forbidden: ['update', 'generateInvoice', 'addResident'],
        reason: 'Hợp đồng hết hạn',
    },
};

// Dispute State Machine
export const DISPUTE_ACTION_MATRIX: Record<
    string,
    { allowed: string[]; forbidden: string[]; deadline?: boolean }
> = {
    OPEN: {
        allowed: ['uploadEvidence', 'addComment', 'escalate'],
        forbidden: ['resolve', 'reopen'],
        deadline: true, // Has evidence deadline
    },
    PENDING: {
        allowed: ['uploadEvidence', 'addComment'],
        forbidden: ['resolve'],
        deadline: true,
    },
    ESCALATED: {
        allowed: ['adminResolve', 'viewEvidence'],
        forbidden: ['uploadEvidence', 'tenantResolve', 'landlordResolve'],
    },
    APPROVED: {
        allowed: ['viewAudit'],
        forbidden: ['uploadEvidence', 'resolve', 'reopen'],
    },
    REJECTED: {
        allowed: ['viewAudit'],
        forbidden: ['uploadEvidence', 'resolve'],
    },
    PARTIAL: {
        allowed: ['viewAudit'],
        forbidden: ['uploadEvidence', 'resolve'],
    },
};

// Invoice State Machine
export const INVOICE_ACTION_MATRIX: Record<
    string,
    { allowed: string[]; forbidden: string[] }
> = {
    PENDING: {
        allowed: ['pay', 'generateQR', 'sendReminder'],
        forbidden: ['refund', 'delete'],
    },
    PAID: {
        allowed: ['viewReceipt', 'generatePDF'],
        forbidden: ['pay', 'delete', 'update'],
    },
    OVERDUE: {
        allowed: ['pay', 'sendReminder', 'markBadDebt'],
        forbidden: ['delete'],
    },
    CANCELLED: {
        allowed: ['viewAudit'],
        forbidden: ['pay', 'delete', 'update'],
    },
};

/**
 * Check if action is allowed for current state
 */
export function isActionAllowed(
    entityType: 'CONTRACT' | 'DISPUTE' | 'INVOICE',
    status: string,
    action: string
): { allowed: boolean; reason?: string } {
    const matrix =
        entityType === 'CONTRACT'
            ? CONTRACT_ACTION_MATRIX
            : entityType === 'DISPUTE'
                ? DISPUTE_ACTION_MATRIX
                : INVOICE_ACTION_MATRIX;

    const stateConfig = matrix[status];

    if (!stateConfig) {
        return { allowed: false, reason: `Unknown status: ${status}` };
    }

    if (stateConfig.forbidden.includes(action)) {
        return {
            allowed: false,
            reason: (stateConfig as { reason?: string }).reason || `Action "${action}" not allowed in status "${status}"`,
        };
    }

    if (stateConfig.allowed.includes(action)) {
        return { allowed: true };
    }

    // Default: not explicitly allowed = forbidden (secure by default)
    return {
        allowed: false,
        reason: `Action "${action}" not explicitly allowed for status "${status}"`,
    };
}

/**
 * Get all allowed actions for current state
 */
export function getAllowedActions(
    entityType: 'CONTRACT' | 'DISPUTE' | 'INVOICE',
    status: string
): string[] {
    const matrix =
        entityType === 'CONTRACT'
            ? CONTRACT_ACTION_MATRIX
            : entityType === 'DISPUTE'
                ? DISPUTE_ACTION_MATRIX
                : INVOICE_ACTION_MATRIX;

    return matrix[status]?.allowed || [];
}

/**
 * Hook to use in components
 */
export function useActionMatrix(
    entityType: 'CONTRACT' | 'DISPUTE' | 'INVOICE',
    status: string
) {
    return {
        isAllowed: (action: string) => isActionAllowed(entityType, status, action),
        allowedActions: getAllowedActions(entityType, status),
        isFrozen:
            status === 'TERMINATED' ||
            status === 'APPROVED' ||
            status === 'REJECTED' ||
            status === 'PAID',
    };
}
