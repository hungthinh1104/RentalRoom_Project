import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send verification email with token
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const verificationUrl = `${appUrl}/auth/verify?code=${code}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email - Smart Room',
        template: './verify-email',
        context: {
          name,
          code,
          verificationUrl,
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Smart Room! 🎉',
        template: './welcome',
        context: {
          name,
          appUrl,
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send password reset email (for future implementation)
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password - Smart Room',
        template: './reset-password',
        context: {
          name,
          resetUrl,
          resetToken,
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send rental application notification to landlord
   */
  async sendRentalApplicationNotification(
    landlordEmail: string,
    landlordName: string,
    roomName: string,
    roomAddress: string,
    roomPrice: number,
    tenantName: string,
    tenantEmail: string,
    tenantPhone: string,
    requestedMoveInDate?: string,
    message?: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const dashboardUrl = `${appUrl}/dashboard/landlord/applications`;

    try {
      await this.mailerService.sendMail({
        to: landlordEmail,
        subject: `Đơn Đăng Ký Thuê Phòng Mới - ${roomName}`,
        template: './rental-application',
        context: {
          landlordName,
          roomName,
          roomAddress,
          roomPrice: roomPrice.toLocaleString('vi-VN'),
          tenantName,
          tenantEmail,
          tenantPhone,
          requestedMoveInDate,
          message,
          dashboardUrl,
        },
      });

      this.logger.log(
        `Rental application notification email sent to ${landlordEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send rental application notification to ${landlordEmail}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send rental application status update to tenant
   */
  async sendRentalApplicationStatusEmail(
    tenantEmail: string,
    tenantName: string,
    roomName: string,
    statusLabel: string,
    isApproved: boolean,
    landlordName: string,
    landlordEmail: string,
    landlordPhone?: string | null,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const dashboardUrl = `${appUrl}/dashboard/tenant/applications`;

    try {
      await this.mailerService.sendMail({
        to: tenantEmail,
        subject: `Cập nhật đơn thuê - ${roomName}`,
        template: './rental-application-status',
        context: {
          tenantName,
          roomName,
          statusLabel,
          isApproved,
          isRejected: !isApproved,
          landlordName,
          landlordEmail,
          landlordPhone,
          dashboardUrl,
        },
      });

      this.logger.log(
        `Rental application status email sent to ${tenantEmail} - ${statusLabel}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send rental application status email to ${tenantEmail}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send generic HTML email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
