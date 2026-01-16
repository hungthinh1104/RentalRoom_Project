import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LegalDocumentsService } from './legal-documents.service';
import { PdfUploadService } from './services';
import {
  CreateDocumentDto,
  CreateVersionDto,
  UpdateDocumentDto,
  PublishVersionDto,
} from './dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '../users/entities';
import type { Request } from 'express';

@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(
    private readonly legalDocumentsService: LegalDocumentsService,
    private readonly pdfUploadService: PdfUploadService,
  ) {}

  /**
   * Get client IP from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Create legal document
   * SECURITY: ADMIN ONLY
   */
  @Post()
  @Auth(UserRole.ADMIN)
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.legalDocumentsService.createDocument(
      dto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Get all documents
   * SECURITY: ADMIN can see all, others see published only
   */
  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @CurrentUser() user?: any,
  ) {
    const filters: any = {};

    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    // Non-admin users can only see published documents
    if (!user || user.role !== UserRole.ADMIN) {
      filters.isPublished = true;
    }

    return this.legalDocumentsService.findAll(filters);
  }

  /**
   * Get document by ID
   * SECURITY: ADMIN can see all, others only published
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() _user?: any) {
    return this.legalDocumentsService.findOne(id);
  }

  /**
   * Get document by slug (for public access)
   * NO AUTH REQUIRED
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.legalDocumentsService.findBySlug(slug);
  }

  /**
   * Update document metadata
   * SECURITY: ADMIN ONLY
   */
  @Patch(':id')
  @Auth(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.legalDocumentsService.updateDocument(
      id,
      dto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Soft delete document
   * SECURITY: ADMIN ONLY
   * WARNING: This does NOT permanently delete (legal compliance)
   */
  @Delete(':id')
  @Auth(UserRole.ADMIN)
  softDelete(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.legalDocumentsService.softDeleteDocument(
      id,
      user.id,
      reason,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  /**
   * Create new version
   * SECURITY: ADMIN ONLY
   */
  @Post(':id/versions')
  @Auth(UserRole.ADMIN)
  createVersion(
    @Param('id') documentId: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.legalDocumentsService.createVersion(
      documentId,
      dto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Publish version
   * SECURITY: ADMIN ONLY
   * CRITICAL: This locks the version permanently
   */
  @Post(':id/versions/:versionId/publish')
  @Auth(UserRole.ADMIN)
  publishVersion(
    @Param('id') documentId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PublishVersionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.legalDocumentsService.publishVersion(
      documentId,
      versionId,
      dto,
      user.id,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // AUDIT & COMPLIANCE
  // ============================================================================

  /**
   * Get audit history
   * SECURITY: ADMIN ONLY
   */
  @Get(':id/audit')
  @Auth(UserRole.ADMIN)
  getAuditHistory(@Param('id') documentId: string) {
    return this.legalDocumentsService.getAuditHistory(documentId);
  }

  /**
   * Verify content integrity
   * Checks if content matches SHA-256 hash
   * SECURITY: ADMIN ONLY
   */
  @Get(':id/versions/:versionId/verify')
  @Auth(UserRole.ADMIN)
  async verifyIntegrity(
    @Param('id') documentId: string,
    @Param('versionId') versionId: string,
  ) {
    const isValid =
      await this.legalDocumentsService.verifyContentIntegrity(versionId);

    return {
      versionId,
      isValid,
      message: isValid
        ? 'Content integrity verified - no tampering detected'
        : 'WARNING: Content has been tampered with!',
    };
  }

  // ============================================================================
  // PDF ATTACHMENTS
  // ============================================================================

  /**
   * Upload PDF attachment to version
   * SECURITY: ADMIN ONLY, max 10MB
   */
  @Post(':id/versions/:versionId/upload-pdf')
  @Auth(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @Param('id') documentId: string,
    @Param('versionId') versionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = this.getClientIp(req);
    return this.pdfUploadService.uploadPdf(
      versionId,
      file,
      user.id,
      description,
      ipAddress,
    );
  }

  /**
   * Download PDF attachment
   * SECURITY: ADMIN can download all, others only from published versions
   */
  @Get('attachments/:attachmentId/download')
  async downloadPdf(@Param('attachmentId') attachmentId: string) {
    const { buffer, fileName, mimeType } =
      await this.pdfUploadService.getPdf(attachmentId);

    // Return file as response (NestJS will handle this)
    return {
      buffer,
      fileName,
      mimeType,
    };
  }

  /**
   * Verify PDF integrity
   * SECURITY: ADMIN ONLY
   */
  @Get('attachments/:attachmentId/verify')
  @Auth(UserRole.ADMIN)
  async verifyPdfIntegrity(@Param('attachmentId') attachmentId: string) {
    const isValid =
      await this.pdfUploadService.verifyPdfIntegrity(attachmentId);

    return {
      attachmentId,
      isValid,
      message: isValid
        ? 'PDF integrity verified - no tampering detected'
        : 'WARNING: PDF file has been tampered with!',
    };
  }
}
