import { Module } from '@nestjs/common';
import { PCCCController } from './pccc.controller';
import { PCCCService } from './services/pccc.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PCCCController],
  providers: [PCCCService],
  exports: [PCCCService],
})
export class PCCCModule {}
