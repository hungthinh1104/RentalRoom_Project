import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [SnapshotsModule],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
