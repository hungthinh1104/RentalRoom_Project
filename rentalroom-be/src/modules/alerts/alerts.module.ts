import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlertingService } from './alerting.service';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, NotificationsModule],
  providers: [AlertingService, PrismaService],
  exports: [AlertingService],
})
export class AlertsModule {}
