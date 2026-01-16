import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { ContractStatus } from '../entities';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class ContractSchedulerService {
  private readonly logger = new Logger(ContractSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // Run every day at 9 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringContracts() {
    this.logger.log('Checking for expiring contracts...');

    const today = new Date();
    const warningPeriods = [30, 15, 7, 3, 1]; // Days before expiration

    for (const days of warningPeriods) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);

      // Find contracts expiring on target date
      const expiringContracts = await this.prisma.contract.findMany({
        where: {
          status: ContractStatus.ACTIVE,
          endDate: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: { include: { property: true } },
        },
      });

      for (const contract of expiringContracts) {
        try {
          const tenantUser = contract.tenant.user;
          const landlordUser = contract.landlord.user;
          const roomInfo = `Phòng ${contract.room.roomNumber} - ${contract.room.property.name}`;

          let warningMessage = '';
          let emailSubject = '';

          if (days === 30) {
            warningMessage = `⏰ Hợp đồng của bạn sẽ hết hạn trong 30 ngày (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ để gia hạn hoặc thông báo chuyển đi.`;
            emailSubject = '⏰ Hợp đồng sắp hết hạn - Còn 30 ngày';
          } else if (days === 15) {
            warningMessage = `⚠️ Hợp đồng của bạn sẽ hết hạn trong 15 ngày (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ ngay để gia hạn hoặc thông báo chuyển đi.`;
            emailSubject = '⚠️ Hợp đồng sắp hết hạn - Còn 15 ngày';
          } else if (days === 7) {
            warningMessage = `🔔 Hợp đồng của bạn sẽ hết hạn trong 7 ngày (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ GẤP để gia hạn hoặc chuẩn bị chuyển đi.`;
            emailSubject = '🔔 HỢP ĐỒNG SẮP HẾT HẠN - Còn 7 ngày';
          } else if (days === 3) {
            warningMessage = `🚨 Hợp đồng của bạn sẽ hết hạn trong 3 ngày (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ KHẨN để gia hạn hoặc chuẩn bị trả phòng.`;
            emailSubject = '🚨 KHẨN: Hợp đồng sắp hết hạn - Còn 3 ngày';
          } else if (days === 1) {
            warningMessage = `🔴 Hợp đồng của bạn sẽ hết hạn VÀO NGÀY MAI (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ NGAY để xử lý.`;
            emailSubject = '🔴 KHẨN CẤP: Hợp đồng hết hạn vào ngày mai';
          }

          // Notify tenant
          await this.notificationsService.create({
            userId: tenantUser.id,
            title: `${emailSubject} - ${roomInfo}`,
            content: warningMessage,
            notificationType: NotificationType.CONTRACT,
            relatedEntityId: contract.id,
            isRead: false,
          });

          // Notify landlord
          await this.notificationsService.create({
            userId: landlordUser.id,
            title: `${emailSubject} - ${roomInfo}`,
            content: `Hợp đồng với khách hàng ${tenantUser.fullName} sẽ hết hạn trong ${days} ngày (${new Date(contract.endDate).toLocaleDateString('vi-VN')}). Vui lòng liên hệ để thảo luận gia hạn.`,
            notificationType: NotificationType.CONTRACT,
            relatedEntityId: contract.id,
            isRead: false,
          });

          // Send email to tenant
          await this.emailService.sendEmail(
            tenantUser.email,
            emailSubject,
            `<h2>${emailSubject}</h2>
             <p><strong>Hợp đồng:</strong> ${contract.contractNumber}</p>
             <p><strong>Phòng:</strong> ${roomInfo}</p>
             <p><strong>Ngày hết hạn:</strong> ${new Date(contract.endDate).toLocaleDateString('vi-VN')}</p>
             <hr>
             <p>${warningMessage}</p>
             <hr>
             <h3>📋 Lưu ý quan trọng:</h3>
             <ul>
               <li><strong>Nếu muốn gia hạn:</strong> Vui lòng liên hệ chủ nhà để ký hợp đồng mới</li>
               <li><strong>Nếu chuyển đi:</strong> Phải báo trước ít nhất 30 ngày để không bị mất cọc</li>
               <li><strong>Chấm dứt sớm:</strong> Sẽ mất 100% tiền cọc theo điều khoản hợp đồng</li>
             </ul>
             <hr>
             <p><strong>Chủ nhà:</strong> ${landlordUser.fullName}</p>
             <p><strong>Điện thoại:</strong> ${landlordUser.phoneNumber}</p>
             <p><strong>Email:</strong> ${landlordUser.email}</p>`,
          );

          this.logger.log(
            `Sent ${days}-day expiry warning for contract ${contract.contractNumber}`,
          );
        } catch (error: unknown) {
          const msg = (error as Error)?.message ?? String(error);
          this.logger.error(
            `Failed to send expiry warning for contract ${contract.id}: ${msg}`,
          );
        }
      }
    }

    this.logger.log('Finished checking expiring contracts');
  }

  // Auto-expire contracts that are past end date
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoExpireContracts() {
    this.logger.log('Auto-expiring past contracts...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredContracts = await this.prisma.contract.updateMany({
      where: {
        status: ContractStatus.ACTIVE,
        endDate: {
          lt: today,
        },
      },
      data: {
        status: ContractStatus.EXPIRED,
      },
    });

    this.logger.log(`Auto-expired ${expiredContracts.count} contracts`);
  }
}
