import { Module } from '@nestjs/common';
import { PCCCController } from './pccc.controller';
import { PCCCService } from './services/pccc.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [PrismaModule, SnapshotsModule],
  controllers: [PCCCController],
  providers: [PCCCService],
  exports: [PCCCService],
})
export class PCCCModule {}
