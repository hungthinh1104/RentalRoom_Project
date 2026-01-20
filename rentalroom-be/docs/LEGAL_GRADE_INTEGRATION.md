/**
 * ☠️ LEGAL-GRADE INTEGRATION GUIDE
 * 
 * Hướng dẫn tích hợp infrastructure mới vào các services hiện tại
 * 
 * CRITICAL: Đây là examples thật, không phải best practice chung chung
 * Copy-paste vào services thật để cứu hệ thống
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

// Import legal infrastructure
import { EventStoreService, DomainEvent } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import { ImmutabilityGuard, IdempotencyGuard } from 'src/shared/guards/immutability.guard';
import { AdminAuditService } from 'src/shared/audit/admin-audit.service';

/**
 * EXAMPLE 1: PAYMENT SERVICE - FULL INTEGRATION
 * 
 * Shows:
 * - Event sourcing
 * - State machine
 * - Idempotency
 * - Immutability
 */
@Injectable()
export class PaymentServiceExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStoreService,
    private readonly stateMachine: StateMachineGuard,
    private readonly immutability: ImmutabilityGuard,
    private readonly idempotency: IdempotencyGuard,
  ) {}

  /**
   * CREATE PAYMENT - WITH LEGAL GUARANTEES
   * 
   * BEFORE: Simple create without guards
   * AFTER: Event-sourced, idempotent, state-validated
   */
  async createPayment(
    dto: any,
    userId: string,
    idempotencyKey: string, // From header
  ) {
    // 1. IDEMPOTENCY: Prevent duplicate payments
    return await this.idempotency.executeIdempotent(
      idempotencyKey,
      'CREATE_PAYMENT',
      userId,
      async () => {
        // 2. Get invoice and validate
        const invoice = await this.prisma.invoice.findUnique({
          where: { id: dto.invoiceId },
        });

        if (!invoice) {
          throw new BadRequestException('Invoice not found');
        }

        // 3. STATE MACHINE: Validate invoice state allows payment
        if (invoice.status === 'PAID') {
          throw new BadRequestException('Invoice already paid');
        }

        // 4. Create payment in transaction
        const result = await this.prisma.$transaction(async (tx) => {
          const correlationId = uuidv4(); // Group all related events

          // Create payment
          const payment = await tx.payment.create({
            data: {
              ...dto,
              status: 'PENDING',
            },
          });

          // 5. EVENT STORE: Record creation event
          await this.eventStore.append({
            eventId: uuidv4(),
            eventType: 'PAYMENT_INITIATED',
            correlationId,
            aggregateId: payment.id,
            aggregateType: 'PAYMENT',
            aggregateVersion: 1, // First event
            payload: {
              paymentId: payment.id,
              invoiceId: dto.invoiceId,
              amount: dto.amount,
              method: dto.method,
            },
            metadata: {
              userId,
              userRole: 'TENANT',
              timestamp: new Date(),
              source: 'API',
            },
          });

          return payment;
        });

        return result;
      },
    );
  }

  /**
   * COMPLETE PAYMENT - WITH STATE TRANSITION VALIDATION
   */
  async completePayment(
    paymentId: string,
    userId: string,
    reason?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // 1. STATE MACHINE: Validate transition PENDING → COMPLETED
    this.stateMachine.validateTransition(
      'PAYMENT',
      paymentId,
      payment.status,
      'COMPLETED',
      userId,
      reason,
    );

    // 2. Update payment + record event
    return await this.prisma.$transaction(async (tx) => {
      // Get correlation ID from previous events
      const previousEvents = await this.eventStore.getEventStream(
        paymentId,
        'PAYMENT',
      );
      const correlationId = previousEvents[0]?.correlationId || uuidv4();

      // Update payment
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });

      // 3. EVENT STORE: Record completion event
      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'PAYMENT_COMPLETED',
        correlationId,
        causationId: previousEvents[previousEvents.length - 1]?.eventId, // Link to previous event
        aggregateId: paymentId,
        aggregateType: 'PAYMENT',
        aggregateVersion: previousEvents.length + 1, // Increment version
        payload: {
          paymentId,
          previousStatus: payment.status,
          newStatus: 'COMPLETED',
          paidAt: new Date().toISOString(),
        },
        metadata: {
          userId,
          userRole: 'TENANT',
          timestamp: new Date(),
          source: 'API',
        },
      });

      return updated;
    });
  }

  /**
   * UPDATE PAYMENT - WITH IMMUTABILITY CHECK
   */
  async updatePayment(
    paymentId: string,
    updateDto: any,
    userId: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // 1. IMMUTABILITY: Check if payment is frozen
    await this.immutability.enforceImmutability(
      'PAYMENT',
      paymentId,
      payment.status,
      updateDto, // Fields being updated
      userId,
    );

    // If we get here → update is allowed (payment not frozen)
    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: updateDto,
    });
  }
}

/**
 * EXAMPLE 2: INVOICE SERVICE - FREEZE AFTER PAYMENT
 */
@Injectable()
export class InvoiceServiceExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStoreService,
    private readonly stateMachine: StateMachineGuard,
    private readonly immutability: ImmutabilityGuard,
  ) {}

  /**
   * UPDATE INVOICE - WITH FREEZE PROTECTION
   * 
   * CRITICAL: Once paid, invoice CANNOT be modified
   */
  async updateInvoice(
    invoiceId: string,
    updateDto: any,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    // 1. IMMUTABILITY: Reject if invoice is PAID or BAD_DEBT
    await this.immutability.enforceImmutability(
      'INVOICE',
      invoiceId,
      invoice.status,
      updateDto,
      userId,
    );

    // 2. Update allowed → proceed
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: updateDto,
      });

      // 3. EVENT STORE: Record modification
      const previousEvents = await this.eventStore.getEventStream(
        invoiceId,
        'INVOICE',
      );

      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'INVOICE_MODIFIED',
        correlationId: previousEvents[0]?.correlationId || uuidv4(),
        causationId: previousEvents[previousEvents.length - 1]?.eventId,
        aggregateId: invoiceId,
        aggregateType: 'INVOICE',
        aggregateVersion: previousEvents.length + 1,
        payload: {
          invoiceId,
          changes: updateDto,
          previousValues: {
            amount: invoice.totalAmount,
            dueDate: invoice.dueDate,
          },
        },
        metadata: {
          userId,
          userRole: 'LANDLORD',
          timestamp: new Date(),
          source: 'API',
        },
      });

      return updated;
    });
  }

  /**
   * MARK INVOICE AS PAID - WITH STATE TRANSITION
   */
  async markAsPaid(
    invoiceId: string,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    // 1. STATE MACHINE: Validate transition
    this.stateMachine.validateTransition(
      'INVOICE',
      invoiceId,
      invoice.status,
      'PAID',
      userId,
      'Payment received',
    );

    // 2. Update invoice → now FROZEN
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // 3. EVENT STORE: Record payment
      const previousEvents = await this.eventStore.getEventStream(
        invoiceId,
        'INVOICE',
      );

      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'INVOICE_PAID',
        correlationId: previousEvents[0]?.correlationId || uuidv4(),
        causationId: previousEvents[previousEvents.length - 1]?.eventId,
        aggregateId: invoiceId,
        aggregateType: 'INVOICE',
        aggregateVersion: previousEvents.length + 1,
        payload: {
          invoiceId,
          amount: invoice.totalAmount,
          paidAt: new Date().toISOString(),
          // ☠️ CRITICAL: After this event, invoice is FROZEN
          frozen: true,
        },
        metadata: {
          userId,
          userRole: 'TENANT',
          timestamp: new Date(),
          source: 'API',
        },
      });

      return updated;
    });
  }
}

/**
 * EXAMPLE 3: ADMIN ACTIONS - WITH AUDIT TRAIL
 */
@Injectable()
export class AdminServiceExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAudit: AdminAuditService,
  ) {}

  /**
   * DELETE INVOICE (ADMIN) - WITH FULL AUDIT
   * 
   * CRITICAL: Every admin action MUST be logged
   */
  async deleteInvoice(
    invoiceId: string,
    adminId: string,
    reason: string,
    ipAddress: string,
  ) {
    // 1. Get invoice before deletion
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    // 2. Perform deletion
    await this.prisma.invoice.delete({
      where: { id: invoiceId },
    });

    // 3. ADMIN AUDIT: Log deletion (MANDATORY)
    await this.adminAudit.logAdminAction({
      adminId,
      action: 'DELETE_INVOICE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      beforeValue: invoice as any,
      afterValue: null,
      reason,
      ipAddress,
      timestamp: new Date(),
    });

    return { success: true };
  }

  /**
   * BULK DELETE (ADMIN) - WITH PATTERN DETECTION
   */
  async bulkDelete(
    invoiceIds: string[],
    adminId: string,
    reason: string,
    ipAddress: string,
  ) {
    for (const invoiceId of invoiceIds) {
      await this.deleteInvoice(invoiceId, adminId, reason, ipAddress);
    }

    // ☠️ CRITICAL: AdminAuditService will detect suspicious patterns:
    // - If >10 deletions in 1 hour → ALERT
    // - If bulk operation → ALERT

    return { deleted: invoiceIds.length };
  }
}

/**
 * EXAMPLE 4: CONTRACT SERVICE - FULL LIFECYCLE
 */
@Injectable()
export class ContractServiceExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStoreService,
    private readonly stateMachine: StateMachineGuard,
    private readonly immutability: ImmutabilityGuard,
  ) {}

  /**
   * ACTIVATE CONTRACT - WITH FREEZE
   */
  async activateContract(
    contractId: string,
    userId: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    // 1. STATE MACHINE: Validate transition DEPOSIT_PENDING → ACTIVE
    this.stateMachine.validateTransition(
      'CONTRACT',
      contractId,
      contract.status,
      'ACTIVE',
      userId,
      'Deposit received, activating contract',
    );

    // 2. Update contract → now FROZEN
    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: 'ACTIVE',
          signedAt: new Date(),
        },
      });

      // 3. EVENT STORE: Record activation
      const previousEvents = await this.eventStore.getEventStream(
        contractId,
        'CONTRACT',
      );

      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'CONTRACT_ACTIVATED',
        correlationId: previousEvents[0]?.correlationId || uuidv4(),
        causationId: previousEvents[previousEvents.length - 1]?.eventId,
        aggregateId: contractId,
        aggregateType: 'CONTRACT',
        aggregateVersion: previousEvents.length + 1,
        payload: {
          contractId,
          contractNumber: contract.contractNumber,
          startDate: contract.startDate,
          endDate: contract.endDate,
          monthlyRent: contract.monthlyRent.toString(),
          // ☠️ CRITICAL: After this event, contract terms are FROZEN
          frozen: true,
        },
        metadata: {
          userId,
          userRole: 'LANDLORD',
          timestamp: new Date(),
          source: 'API',
        },
      });

      return updated;
    });
  }

  /**
   * UPDATE CONTRACT - WITH FREEZE PROTECTION
   */
  async updateContract(
    contractId: string,
    updateDto: any,
    userId: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    // 1. IMMUTABILITY: Reject if contract is ACTIVE, TERMINATED, or EXPIRED
    await this.immutability.enforceImmutability(
      'CONTRACT',
      contractId,
      contract.status,
      updateDto,
      userId,
    );

    // 2. Update allowed → proceed
    return await this.prisma.contract.update({
      where: { id: contractId },
      data: updateDto,
    });
  }
}

/**
 * EXAMPLE 5: DAILY INTEGRITY CHECKS
 * 
 * Run these via cron to detect tampering
 */
@Injectable()
export class IntegrityCheckService {
  constructor(
    private readonly eventStore: EventStoreService,
    private readonly adminAudit: AdminAuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * VERIFY EVENT STORE INTEGRITY - Daily at 1 AM
   */
  async verifyEventStoreIntegrity() {
    // Get all aggregates
    const aggregates = await this.prisma.domainEvent.findMany({
      distinct: ['aggregateId', 'aggregateType'],
    });

    for (const aggregate of aggregates) {
      const result = await this.eventStore.verifyIntegrity(
        aggregate.aggregateId,
        aggregate.aggregateType,
      );

      if (!result.isValid) {
        // ☠️ CRITICAL: Tampering detected
        console.error('EVENT STORE TAMPERING DETECTED', result.errors);
        // TODO: Send CRITICAL alert to security team
      }
    }
  }

  /**
   * VERIFY ADMIN AUDIT INTEGRITY - Daily at 2 AM
   */
  async verifyAdminAuditIntegrity() {
    await this.adminAudit.verifyAuditIntegrity();
    // Cron already defined in service
  }
}
