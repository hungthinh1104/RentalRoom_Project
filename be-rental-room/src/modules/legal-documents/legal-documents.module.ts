import { Module } from '@nestjs/common';
import { LegalDocumentsService } from './legal-documents.service';
import { LegalDocumentsController } from './legal-documents.controller';
import { PdfUploadService } from './pdf-upload.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LegalDocumentsController],
  providers: [LegalDocumentsService, PdfUploadService],
  exports: [LegalDocumentsService],
})
export class LegalDocumentsModule {}
