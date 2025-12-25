import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { LandlordsController } from './landlords.controller';
import { LandlordsService } from './landlords.service';

@Module({
  imports: [],
  controllers: [LandlordsController],
  providers: [LandlordsService, PrismaService],
  exports: [LandlordsService],
})
export class LandlordsModule {}
