import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FptAieKycProvider } from './providers/fpt-ai.provider';
import { VnpteKycProvider } from './providers/vnpt.provider';
import { IeKycService } from './ekyc.types';

/**
 * eKYC Factory Module
 * Provides provider selection based on configuration
 * UC_AUTH_01: Identity verification gateway
 */
@Module({
  providers: [
    {
      provide: 'EKYC_SERVICE',
      useFactory: (configService: ConfigService): IeKycService => {
        const provider = configService.get('EKYC_PROVIDER', 'FPT_AI');

        if (provider === 'VNPT') {
          return new VnpteKycProvider(configService);
        }
        // Default to FPT.AI
        return new FptAieKycProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['EKYC_SERVICE'],
})
export class eKycModule {}
