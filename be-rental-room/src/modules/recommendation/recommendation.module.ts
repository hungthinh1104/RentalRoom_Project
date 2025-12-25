import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
  exports: [],
})
export class RecommendationModule {}
