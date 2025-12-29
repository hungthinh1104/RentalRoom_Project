import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { CacheService } from './services/cache.service';
import { CertificateService } from './services/certificate.service';
import { DigitalSignatureService } from './services/digital-signature.service';
import { ContractTemplateService } from './services/contract-template.service';
import { EncryptionService } from './services/encryption.service';

@Module({
  providers: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
    EncryptionService,
  ],
  exports: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
  ],
})
export class CommonModule { }
