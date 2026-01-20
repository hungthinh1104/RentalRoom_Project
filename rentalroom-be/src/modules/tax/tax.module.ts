import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [SnapshotsModule],
  providers: [TaxService],
  controllers: [TaxController],
  exports: [TaxService],
})
export class TaxModule {}
