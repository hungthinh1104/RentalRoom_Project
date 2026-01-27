import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationOutboxService } from './outbox.service';
import { NotificationsGateway } from './gateways';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
    }),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationOutboxService,
    PrismaService,
    NotificationsGateway,
    {
      provide: 'NOTIFICATIONS_GATEWAY',
      useExisting: NotificationsGateway,
    },
  ],
  exports: [
    NotificationsService,
    NotificationOutboxService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
