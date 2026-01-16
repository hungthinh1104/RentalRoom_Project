import { Injectable, BadRequestException } from '@nestjs/common';
import { ContractStatus } from '../entities';

/**
 * Service for validating contract status transitions
 * Prevents invalid state changes in contract lifecycle
 */
@Injectable()
export class ContractValidationService {
  /**
   * Validate contract status transitions to prevent invalid state changes
   * @throws BadRequestException if transition is invalid
   */
  validateStatusTransition(
    oldStatus: ContractStatus,
    newStatus: ContractStatus,
  ): void {
    const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [
        ContractStatus.PENDING_SIGNATURE,
        ContractStatus.CANCELLED,
      ],
      [ContractStatus.PENDING_SIGNATURE]: [
        ContractStatus.DEPOSIT_PENDING,
        ContractStatus.CANCELLED,
      ],
      [ContractStatus.DEPOSIT_PENDING]: [
        ContractStatus.ACTIVE,
        ContractStatus.CANCELLED,
        ContractStatus.EXPIRED,
      ],
      [ContractStatus.ACTIVE]: [
        ContractStatus.TERMINATED,
        ContractStatus.EXPIRED,
      ],
      [ContractStatus.TERMINATED]: [], // Terminal state
      [ContractStatus.EXPIRED]: [], // Terminal state
      [ContractStatus.CANCELLED]: [], // Terminal state
    };

    const allowedTransitions = VALID_TRANSITIONS[oldStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${oldStatus} → ${newStatus}. ` +
          `Allowed transitions from ${oldStatus}: ${allowedTransitions?.join(', ') || 'none'}`,
      );
    }
  }
}
