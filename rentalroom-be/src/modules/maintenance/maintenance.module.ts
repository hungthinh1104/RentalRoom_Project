import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [NotificationsModule, SnapshotsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, PrismaService],
  exports: [MaintenanceService],
})
export class MaintenanceModule { }
