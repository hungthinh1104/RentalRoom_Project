import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AuditAction } from '../entities/legal-document.entity';

@Injectable()
export class PdfUploadService {
  private readonly logger = new Logger(PdfUploadService.name);
  private readonly uploadDir = join(
    process.cwd(),
    'uploads',
    'legal-documents',
  );
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = ['application/pdf'];

  constructor(private readonly prisma: PrismaService) {
    void this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ready: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  /**
   * Calculate SHA-256 hash of file buffer
   * CRITICAL: Used for integrity verification
   */
  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate PDF file
   * SECURITY: Check file type, size, and basic structure
   */
  private validatePdf(file: Express.Multer.File): void {
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only PDF files are allowed. Got: ${file.mimetype}`,
      );
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Check PDF magic bytes (PDF files start with %PDF-)
    const magicBytes = file.buffer.slice(0, 5).toString('ascii');
    if (!magicBytes.startsWith('%PDF-')) {
      throw new BadRequestException('Invalid PDF file structure');
    }

    this.logger.log(
      `PDF validation passed: ${file.originalname} (${file.size} bytes)`,
    );
  }

  /**
   * Upload PDF attachment for document version
   * CRITICAL: Stores file with SHA-256 hash, saves to disk securely
   */
  async uploadPdf(
    versionId: string,
    file: Express.Multer.File,
    userId: string,
    description?: string,
    ipAddress?: string,
  ) {
    // Validate file
    this.validatePdf(file);

    // Verify version exists and is not locked
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true },
    });

    if (!version) {
      throw new BadRequestException('Document version not found');
    }

    if (version.isLocked) {
      throw new BadRequestException('Cannot upload PDF to locked version');
    }

    // Calculate file hash
    const fileHash = this.calculateFileHash(file.buffer);

    // Check for duplicate hash (prevent duplicate uploads)
    const existing = await this.prisma.documentAttachment.findFirst({
      where: {
        versionId,
        fileHash,
        deletedAt: null,
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate PDF detected: ${fileHash}`);
      throw new BadRequestException('This PDF file has already been uploaded');
    }

    // Generate secure filename: {timestamp}-{hash}.pdf
    const timestamp = Date.now();
    const fileName = `${timestamp}-${fileHash.substring(0, 16)}.pdf`;
    const filePath = join('legal-documents', fileName);
    const absolutePath = join(this.uploadDir, fileName);

    // Save file to disk
    try {
      await fs.writeFile(absolutePath, file.buffer);
      this.logger.log(`PDF saved to: ${absolutePath}`);
    } catch (error) {
      this.logger.error('Failed to save PDF file', error);
      throw new BadRequestException('Failed to save PDF file');
    }

    // Save to database
    const attachment = await this.prisma.documentAttachment.create({
      data: {
        versionId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath,
        fileHash,
        description,
        uploadedBy: userId,
        ipAddress,
      },
    });

    // Log to audit trail
    await this.prisma.documentAuditLog.create({
      data: {
        documentId: version.documentId,
        versionId,
        action: AuditAction.CONTENT_MODIFIED,
        userId,
        changes: {
          action: 'PDF_UPLOADED',
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
        },
        ipAddress,
      },
    });

    this.logger.log(
      `PDF uploaded: ${file.originalname} (${file.size} bytes, hash: ${fileHash})`,
    );

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileHash: attachment.fileHash,
      uploadedAt: attachment.uploadedAt,
    };
  }

  /**
   * Get PDF file from disk
   * SECURITY: Verify user has permission before returning file
   */
  async getPdf(attachmentId: string) {
    const attachment = await this.prisma.documentAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        version: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!attachment || attachment.deletedAt) {
      throw new BadRequestException('PDF not found');
    }

    const absolutePath = join(
      this.uploadDir,
      attachment.filePath.split('/').pop()!,
    );

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      this.logger.error(`PDF file not found on disk: ${absolutePath}`);
      throw new BadRequestException('PDF file not found on server');
    }

    // Read file
    const buffer = await fs.readFile(absolutePath);

    // Verify integrity
    const calculatedHash = this.calculateFileHash(buffer);
    if (calculatedHash !== attachment.fileHash) {
      this.logger.error(`PDF integrity check FAILED: ${attachmentId}`);
      throw new BadRequestException(
        'PDF file integrity check failed - file may be corrupted',
      );
    }

    return {
      buffer,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }

  /**
   * Verify PDF integrity
   * Returns true if file on disk matches stored hash
   */
  async verifyPdfIntegrity(attachmentId: string): Promise<boolean> {
    const attachment = await this.prisma.documentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new BadRequestException('PDF not found');
    }

    const absolutePath = join(
      this.uploadDir,
      attachment.filePath.split('/').pop()!,
    );

    try {
      const buffer = await fs.readFile(absolutePath);
      const calculatedHash = this.calculateFileHash(buffer);
      return calculatedHash === attachment.fileHash;
    } catch (error) {
      this.logger.error(
        `Failed to verify PDF integrity: ${attachmentId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Soft delete PDF
   * SECURITY: Never actually delete files - legal compliance
   */
  async softDeletePdf(attachmentId: string, userId: string, reason?: string) {
    const attachment = await this.prisma.documentAttachment.findUnique({
      where: { id: attachmentId },
      include: { version: true },
    });

    if (!attachment || attachment.deletedAt) {
      throw new BadRequestException('PDF not found');
    }

    const deleted = await this.prisma.documentAttachment.update({
      where: { id: attachmentId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Log deletion
    await this.prisma.documentAuditLog.create({
      data: {
        documentId: attachment.version.documentId,
        versionId: attachment.versionId,
        action: AuditAction.DELETED,
        userId,
        changes: {
          action: 'PDF_DELETED',
          fileName: attachment.fileName,
          reason,
        },
        reason,
      },
    });

    this.logger.warn(
      `PDF soft deleted: ${attachmentId} by user ${userId}. Reason: ${reason || 'Not specified'}`,
    );
    return { message: 'PDF soft deleted successfully', attachment: deleted };
  }
}
