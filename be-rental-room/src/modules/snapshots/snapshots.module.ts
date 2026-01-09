import { Module } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { SnapshotCleanupService } from './snapshot-cleanup.service';
import { RegulationService } from './regulation.service';
import { SnapshotsController } from './snapshots.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SnapshotsController],
  providers: [
    SnapshotService,
    SnapshotCleanupService,
    RegulationService,
  ],
  exports: [
    SnapshotService,
    SnapshotCleanupService,
    RegulationService,
  ],
})
export class SnapshotsModule { }
