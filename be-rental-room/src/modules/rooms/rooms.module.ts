import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, CacheService],
  exports: [RoomsService],
})
export class RoomsModule {}
