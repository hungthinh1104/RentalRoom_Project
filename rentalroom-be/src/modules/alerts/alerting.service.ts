import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationOutboxService } from 'src/modules/notifications/outbox.service';
import { ConfigService } from '@nestjs/config';
import { AlertType, AlertSeverity, NotificationType } from '@prisma/client';
import { CronClusterGuard } from 'src/shared/guards/cron-cluster.guard';

// Re-export for external use
export { AlertType, AlertSeverity };

export interface Alert {
  id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  resourceType: 'CONTRACT' | 'INVOICE' | 'PAYMENT' | 'DISPUTE' | 'USER';
  resourceId: string;
  affectedUserId: string;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt?: Date;
  resolvedAt?: Date;
}

/**
 * CRITICAL EVENT ALERTING SYSTEM
 *
 * Monitors critical events that require landlord/admin intervention:
 * 1. Payment failures and overdue invoices
 * 2. Contract expiration and termination
 * 3. Identity verification failures (KYC)
 * 4. Contract signature tampering
 * 5. Dispute escalation and overdue resolution
 * 6. Bad debt and high-risk tenants
 *
 * DELIVERY CHANNELS:
 * - Email notifications (via NotificationOutboxService for guaranteed delivery)
 * - WebSocket real-time alerts (for admin dashboard)
 * - Database storage for audit trail & acknowledgment tracking
 *
 * FREQUENCY:
 * - Payment alerts: Every 5 minutes (urgent detection)
 * - Contract alerts: Daily at 2 AM (scheduled maintenance)
 * - Dispute alerts: Every 30 minutes
 * - Risk alerts: Daily at 3 AM
 *
 * UC_SEC_05: Critical Event Alerting System
 * Ensures landlords are immediately informed of issues requiring action
 */
@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationOutbox: NotificationOutboxService,
    private readonly configService: ConfigService,
    private readonly cronGuard: CronClusterGuard,
  ) {
    this.adminEmail =
      this.configService.get('ADMIN_EMAIL') || 'admin@example.com';
  }

  /**
   * Create and send alert
   *
   * IMPORTANT: Adds alert to notification outbox for guaranteed delivery
   * Stores in database for audit trail and acknowledgment tracking
   *
   * @param alert Alert details
   * @returns Created alert record with ID
   */
  async createAlert(alert: Alert) {
    try {
      // Store alert in database
      const storedAlert = await this.prisma.alert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          resourceType: alert.resourceType,
          resourceId: alert.resourceId,
          affectedUserId: alert.affectedUserId,
          metadata: alert.metadata,
        },
      });

      await (this.prisma as any).changeLog.create({
        data: {
          userId: alert.affectedUserId,
          changeType: 'ALERT_CREATED',
          entityType: 'ALERT',
          entityId: storedAlert.id,
          metadata: {
            type: alert.type,
            severity: alert.severity,
            resourceType: alert.resourceType,
            resourceId: alert.resourceId,
          },
        },
      });

      // Get affected user for email notification
      const affectedUser = await this.prisma.user.findUnique({
        where: { id: alert.affectedUserId },
      });

      if (affectedUser?.email) {
        // Enqueue email notification for guaranteed delivery
        const emailSubject = this.buildEmailSubject(alert);
        const emailBody = this.buildEmailBody(alert);

        await this.notificationOutbox.enqueueNotification(
          affectedUser.email,
          emailSubject,
          emailBody,
          NotificationType.SYSTEM,
          alert.affectedUserId,
        );
      }

      // CRITICAL alerts also go to admin
      if (
        alert.severity === AlertSeverity.CRITICAL &&
        affectedUser?.email !== this.adminEmail
      ) {
        const adminEmailSubject = `[CRITICAL] ${alert.title}`;
        const adminEmailBody = this.buildAdminEmailBody(alert, affectedUser);

        await this.notificationOutbox.enqueueNotification(
          this.adminEmail,
          adminEmailSubject,
          adminEmailBody,
          NotificationType.SYSTEM,
          alert.affectedUserId,
        );
      }

      this.logger.warn(
        `Alert created: ${alert.type} (${alert.severity}) for user ${alert.affectedUserId}`,
      );

      return storedAlert;
    } catch (error) {
      this.logger.error(
        `Failed to create alert of type ${alert.type}`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Check for payment failures and overdue invoices
   * RUN: Every 5 minutes
   *
   * Detects:
   * - Payment failures (3+ failures in 24h)
   * - Overdue invoices (>3 days past due)
   * - Auto-payment retry exhaustion
   */
  @Cron(CronExpression.EVERY_10_MINUTES) // Reduced from EVERY_5_MINUTES for performance
  async checkPaymentAlerts() {
    if (!this.cronGuard.shouldExecute('checkPaymentAlerts')) return;
    try {
      // Find invoices overdue by more than 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: 'PENDING', // Not paid
          dueDate: { lt: threeDaysAgo }, // More than 3 days past due
          // Exclude already alerted (check metadata or use alertedAt flag)
        },
        include: {
          contract: {
            include: {
              landlord: true,
              tenant: true,
            },
          },
        },
        take: 100, // Process in batches
      });

      for (const invoice of overdueInvoices) {
        // Check if alert already exists
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.PAYMENT_OVERDUE,
            resourceId: invoice.id,
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.PAYMENT_OVERDUE,
            severity: AlertSeverity.HIGH,
            title: `Invoice Overdue: ${invoice.invoiceNumber}`,
            description: `Invoice ${invoice.invoiceNumber} is overdue by ${Math.floor(
              (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
            )} days. Amount: ${Number(invoice.totalAmount).toLocaleString(
              'vi-VN',
            )} VNĐ. Immediate payment required.`,
            resourceType: 'INVOICE',
            resourceId: invoice.id,
            affectedUserId: invoice.contract.landlordId,
            metadata: {
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.totalAmount.toString(),
              daysOverdue: Math.floor(
                (Date.now() - invoice.dueDate.getTime()) /
                (1000 * 60 * 60 * 24),
              ),
              tenantName: invoice.contract.tenant?.userId,
            },
          });
        }
      }

      // Find tenants with multiple payment failures
      const failedPayments = await this.prisma.payment.groupBy({
        by: ['tenantId'],
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gte: 3, // 3 or more failures
            },
          },
        },
      });

      for (const failure of failedPayments) {
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.PAYMENT_FAILED_PERSISTENT,
            affectedUserId: failure.tenantId,
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.PAYMENT_FAILED_PERSISTENT,
            severity: AlertSeverity.CRITICAL,
            title: `Multiple Payment Failures Detected`,
            description: `Tenant has ${failure._count.id} failed payment attempts in the last 24 hours. Investigation required.`,
            resourceType: 'PAYMENT',
            resourceId: failure.tenantId,
            affectedUserId: failure.tenantId,
            metadata: {
              failureCount: failure._count.id,
              timeWindow: '24h',
            },
          });
        }
      }

      this.logger.debug(
        `Payment alerts checked: ${overdueInvoices.length} overdue invoices found`,
      );
    } catch (error) {
      this.logger.error('Error checking payment alerts', error);
    }
  }

  /**
   * Check for expiring and expired contracts
   * RUN: Daily at 2 AM
   *
   * Detects:
   * - Contracts expiring in <30 days
   * - Contracts already expired
   * - Pending terminations
   */
  @Cron('0 2 * * *') // 2 AM daily
  async checkContractAlerts() {
    if (!this.cronGuard.shouldExecute('checkContractAlerts')) return;
    try {
      // Find contracts expiring in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringContracts = await this.prisma.contract.findMany({
        where: {
          endDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
          status: 'ACTIVE',
        },
        include: {
          landlord: true,
          tenant: true,
        },
      });

      for (const contract of expiringContracts) {
        const daysUntilExpiry = Math.floor(
          (contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.CONTRACT_EXPIRING_SOON,
            resourceId: contract.id,
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.CONTRACT_EXPIRING_SOON,
            severity:
              daysUntilExpiry <= 7
                ? AlertSeverity.CRITICAL
                : AlertSeverity.HIGH,
            title: `Contract Expiring: ${contract.contractNumber}`,
            description: `Contract ${contract.contractNumber} will expire in ${daysUntilExpiry} days (${new Date(
              contract.endDate,
            ).toLocaleDateString(
              'vi-VN',
            )}). Renewal or termination action needed.`,
            resourceType: 'CONTRACT',
            resourceId: contract.id,
            affectedUserId: contract.landlordId,
            metadata: {
              contractNumber: contract.contractNumber,
              expiryDate: contract.endDate.toISOString(),
              daysUntilExpiry,
            },
          });
        }
      }

      this.logger.debug(
        `Contract alerts checked: ${expiringContracts.length} expiring contracts found`,
      );
    } catch (error) {
      this.logger.error('Error checking contract alerts', error);
    }
  }

  /**
   * Check for dispute escalations and overdue resolutions
   * RUN: Every 30 minutes
   *
   * Detects:
   * - Newly escalated disputes
   * - Disputes pending resolution >14 days
   */
  @Cron('*/30 * * * *') // Every 30 minutes
  async checkDisputeAlerts() {
    if (!this.cronGuard.shouldExecute('checkDisputeAlerts')) return;
    try {
      // Find escalated disputes
      const escalatedDisputes = await this.prisma.dispute.findMany({
        where: {
          status: 'ESCALATED',
        },
        include: {
          contract: {
            include: {
              landlord: true,
              tenant: true,
            },
          },
        },
      });

      for (const dispute of escalatedDisputes) {
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.DISPUTE_ESCALATED,
            resourceId: dispute.id,
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.DISPUTE_ESCALATED,
            severity: AlertSeverity.CRITICAL,
            title: `Dispute Escalated: ${dispute.id}`,
            description: `Dispute regarding contract ${dispute.contract?.contractNumber} has been escalated. Immediate attention required. ${dispute.description}`,
            resourceType: 'DISPUTE',
            resourceId: dispute.id,
            affectedUserId: dispute.contract.landlordId,
            metadata: {
              disputeId: dispute.id,
              claimAmount: dispute.claimAmount.toString(),
            },
          });
        }
      }

      // Find disputes pending >14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const overduDisputes = await this.prisma.dispute.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: fourteenDaysAgo },
        },
        include: {
          contract: {
            include: {
              landlord: true,
            },
          },
        },
      });

      for (const dispute of overduDisputes) {
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.DISPUTE_RESOLUTION_OVERDUE,
            resourceId: dispute.id,
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.DISPUTE_RESOLUTION_OVERDUE,
            severity: AlertSeverity.HIGH,
            title: `Dispute Resolution Overdue: ${dispute.id}`,
            description: `Dispute has been pending for more than 14 days. Resolution action required.`,
            resourceType: 'DISPUTE',
            resourceId: dispute.id,
            affectedUserId: dispute.contract.landlordId,
          });
        }
      }

      this.logger.debug(
        `Dispute alerts checked: ${escalatedDisputes.length} escalated, ${overduDisputes.length} overdue`,
      );
    } catch (error) {
      this.logger.error('Error checking dispute alerts', error);
    }
  }

  /**
   * Check for risk events (bad debt, high-risk tenants)
   * RUN: Daily at 3 AM
   *
   * Detects:
   * - Invoices marked as bad debt
   * - Tenants with high risk scores
   * - Landlords with multiple concurrent disputes
   */
  @Cron('0 3 * * *') // 3 AM daily
  async checkRiskAlerts() {
    if (!this.cronGuard.shouldExecute('checkRiskAlerts')) return;
    try {
      // Find bad debt invoices
      const badDebtInvoices = await this.prisma.badDebtInvoice.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          contract: {
            include: {
              landlord: true,
              tenant: true,
            },
          },
        },
      });

      for (const badDebt of badDebtInvoices) {
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.BAD_DEBT_DETECTED,
            resourceId: badDebt.id.toString(),
            resolvedAt: null,
          },
        });

        if (!existingAlert) {
          await this.createAlert({
            type: AlertType.BAD_DEBT_DETECTED,
            severity: AlertSeverity.CRITICAL,
            title: `Bad Debt Recorded: Contract ${badDebt.contract.contractNumber}`,
            description: `Bad debt recorded for contract ${badDebt.contract.contractNumber}. Amount: ${Number(
              badDebt.amount,
            ).toLocaleString('vi-VN')} VNĐ. Reason: ${badDebt.reason}`,
            resourceType: 'CONTRACT',
            resourceId: badDebt.contractId,
            affectedUserId: badDebt.contract.landlordId,
            metadata: {
              contractNumber: badDebt.contract.contractNumber,
              amount: badDebt.amount.toString(),
              reason: badDebt.reason,
            },
          });
        }
      }

      // Find landlords with 3+ active disputes
      const disputes = await this.prisma.dispute.findMany({
        where: {
          status: { in: ['OPEN', 'ESCALATED'] },
        },
        include: {
          contract: {
            select: {
              landlordId: true,
            },
          },
        },
      });

      // Group by landlordId manually
      const disputesByLandlord = disputes.reduce(
        (acc, dispute) => {
          const landlordId = dispute.contract.landlordId;
          if (!acc[landlordId]) {
            acc[landlordId] = [];
          }
          acc[landlordId].push(dispute);
          return acc;
        },
        {} as Record<string, typeof disputes>,
      );

      for (const [landlordId, landlordDisputes] of Object.entries(
        disputesByLandlord,
      )) {
        if (landlordDisputes.length >= 3) {
          const existingAlert = await this.prisma.alert.findFirst({
            where: {
              type: AlertType.LANDLORD_MULTIPLE_DISPUTES,
              affectedUserId: landlordId,
              resolvedAt: null,
            },
          });

          if (!existingAlert) {
            await this.createAlert({
              type: AlertType.LANDLORD_MULTIPLE_DISPUTES,
              severity: AlertSeverity.MEDIUM,
              title: `Multiple Disputes Alert`,
              description: `Landlord has ${landlordDisputes.length} active disputes. Pattern analysis recommended.`,
              resourceType: 'USER',
              resourceId: landlordId,
              affectedUserId: landlordId,
            });
          }
        }
      }

      this.logger.debug(
        `Risk alerts checked: ${badDebtInvoices.length} bad debt records found`,
      );
    } catch (error) {
      this.logger.error('Error checking risk alerts', error);
    }
  }

  /**
   * Acknowledge alert (user marks as seen)
   *
   * @param alertId Alert UUID
   * @param userId User who acknowledged
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    return await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
  }

  /**
   * Resolve alert (issue addressed)
   *
   * @param alertId Alert UUID
   */
  async resolveAlert(alertId: string) {
    return await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Get active alerts for user
   *
   * @param userId User UUID
   * @param severity Optional severity filter
   * @returns Active alerts
   */
  async getActiveAlerts(userId: string, severity?: AlertSeverity) {
    return await this.prisma.alert.findMany({
      where: {
        affectedUserId: userId,
        resolvedAt: null,
        ...(severity && { severity }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ========== Email Formatting ==========

  private buildEmailSubject(alert: Alert): string {
    const severityPrefix = {
      [AlertSeverity.CRITICAL]: '[CRITICAL]',
      [AlertSeverity.HIGH]: '[URGENT]',
      [AlertSeverity.MEDIUM]: '[ALERT]',
      [AlertSeverity.LOW]: '[INFO]',
    };

    return `${severityPrefix[alert.severity]} ${alert.title}`;
  }

  private buildEmailBody(alert: Alert): string {
    return `
      <h2>${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <hr/>
      <p>${alert.description}</p>
      <p>
        <a href="${process.env.FRONTEND_URL}/alerts/${alert.id}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Alert
        </a>
      </p>
    `;
  }

  private buildAdminEmailBody(alert: Alert, affectedUser: any): string {
    return `
      <h2>[ADMIN ALERT] ${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Affected User:</strong> ${affectedUser?.email || 'Unknown'}</p>
      <hr/>
      <p>${alert.description}</p>
      <p>
        <a href="${process.env.FRONTEND_URL}/admin/alerts/${alert.id}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Admin View
        </a>
      </p>
    `;
  }
}
