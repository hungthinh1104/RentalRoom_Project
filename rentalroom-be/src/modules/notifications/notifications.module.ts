import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './gateways';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
    }),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PrismaService,
    NotificationsGateway,
    {
      provide: 'NOTIFICATIONS_GATEWAY',
      useExisting: NotificationsGateway,
    },
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
