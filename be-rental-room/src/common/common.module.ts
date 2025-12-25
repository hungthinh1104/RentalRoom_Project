import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { CacheService } from './services/cache.service';
import { CertificateService } from './services/certificate.service';
import { DigitalSignatureService } from './services/digital-signature.service';
import { ContractTemplateService } from './services/contract-template.service';

@Module({
  providers: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
  ],
  exports: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
  ],
})
export class CommonModule {}
