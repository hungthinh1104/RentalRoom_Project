import { Module } from '@nestjs/common';
import { SystemFeedbackService } from './system-feedback.service';
import { SystemFeedbackController } from './system-feedback.controller';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SystemFeedbackController],
  providers: [SystemFeedbackService, PrismaService],
})
export class SystemFeedbackModule {}
