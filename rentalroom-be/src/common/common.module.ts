import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { CacheService } from './services/cache.service';
import { CertificateService } from './services/certificate.service';
import { DigitalSignatureService } from './services/digital-signature.service';
import { ContractTemplateService } from './services/contract-template.service';
import { EncryptionService } from './services/encryption.service';
import { InvoiceCalculationsService } from './services/invoice-calculations.service';
import { ContractQueriesService } from './services/contract-queries.service';
import { PrismaService } from '../database/prisma/prisma.service';

@Module({
  providers: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
    EncryptionService,
    InvoiceCalculationsService,
    ContractQueriesService,
    PrismaService,
  ],
  exports: [
    EmailService,
    CacheService,
    CertificateService,
    DigitalSignatureService,
    ContractTemplateService,
    InvoiceCalculationsService,
    ContractQueriesService,
  ],
})
export class CommonModule {}
