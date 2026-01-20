import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';

import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [ScheduleModule.forRoot(), SnapshotsModule],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
