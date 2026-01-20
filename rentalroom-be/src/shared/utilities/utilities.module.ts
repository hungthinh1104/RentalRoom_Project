import { Module, Global } from '@nestjs/common';
import { ContractHashService } from './contract-hash.service';

@Global()
@Module({
  providers: [ContractHashService],
  exports: [ContractHashService],
})
export class UtilitiesModule {}
