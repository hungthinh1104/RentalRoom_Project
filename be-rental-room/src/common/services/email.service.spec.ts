import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: jest.Mocked<MailerService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                APP_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get(MailerService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const code = '123456';

      mailerService.sendMail.mockResolvedValue(undefined as any);

      await service.sendVerificationEmail(email, name, code);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Verify Your Email - Smart Room',
        template: './verify-email',
        context: {
          name,
          code,
          verificationUrl: `http://localhost:3000/auth/verify?code=${code}`,
        },
      });
    });

    it('should throw error if email sending fails', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const code = '123456';

      const error = new Error('SMTP connection failed');
      mailerService.sendMail.mockRejectedValue(error);

      await expect(
        service.sendVerificationEmail(email, name, code),
      ).rejects.toThrow(error);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      mailerService.sendMail.mockResolvedValue(undefined as any);

      await service.sendWelcomeEmail(email, name);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Welcome to Smart Room! 🎉',
        template: './welcome',
        context: {
          name,
          appUrl: 'http://localhost:3000',
        },
      });
    });

    it('should throw error if email sending fails', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      const error = new Error('SMTP connection failed');
      mailerService.sendMail.mockRejectedValue(error);

      await expect(service.sendWelcomeEmail(email, name)).rejects.toThrow(
        error,
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const resetToken = 'reset-token-12345';

      mailerService.sendMail.mockResolvedValue(undefined as any);

      await service.sendPasswordResetEmail(email, name, resetToken);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Reset Your Password - Smart Room',
        template: './reset-password',
        context: {
          name,
          resetUrl: `http://localhost:3000/auth/reset-password?token=${resetToken}`,
          resetToken,
        },
      });
    });

    it('should throw error if email sending fails', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const resetToken = 'reset-token-12345';

      const error = new Error('Template not found');
      mailerService.sendMail.mockRejectedValue(error);

      await expect(
        service.sendPasswordResetEmail(email, name, resetToken),
      ).rejects.toThrow(error);
    });
  });
});
