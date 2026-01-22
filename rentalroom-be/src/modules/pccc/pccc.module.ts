import { Module } from '@nestjs/common';
import { PCCCController } from './pccc.controller';
import { PCCCService } from './services/pccc.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PrismaModule, SnapshotsModule, DocumentsModule],

  controllers: [PCCCController],
  providers: [PCCCService],
  exports: [PCCCService],
})
export class PCCCModule { }
