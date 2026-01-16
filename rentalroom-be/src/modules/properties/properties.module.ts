import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [],
  controllers: [PropertiesController],
  providers: [PropertiesService, PrismaService, CacheService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
