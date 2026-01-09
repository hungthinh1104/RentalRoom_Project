import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [],
  controllers: [RecommendationController],
  providers: [RecommendationService, PrismaService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
