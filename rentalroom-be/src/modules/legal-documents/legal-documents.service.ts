import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateDocumentDto,
  CreateVersionDto,
  UpdateDocumentDto,
  PublishVersionDto,
} from './dto';
import { AuditAction, VersionStatus } from './entities/legal-document.entity';
import { createHash } from 'crypto';

@Injectable()
export class LegalDocumentsService {
  private readonly logger = new Logger(LegalDocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CRITICAL: Calculate SHA-256 hash of content
   * Used for integrity verification and detecting tampering
   */
  private calculateContentHash(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * CRITICAL: Log ALL actions to immutable audit log
   * NEVER skip this - required for legal compliance
   */
  private async logAudit(
    documentId: string,
    versionId: string | null,
    action: AuditAction,
    userId: string,
    changes?: any,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.documentAuditLog.create({
      data: {
        documentId,
        versionId,
        action,
        userId,
        changes: changes || null,
        reason,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(
      `[AUDIT] ${action} on document ${documentId} by user ${userId}`,
    );
  }

  /**
   * Create new legal document
   * SECURITY: Only ADMIN can create
   */
  async createDocument(
    dto: CreateDocumentDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check for duplicate slug
    const existing = await this.prisma.legalDocument.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Document with slug "${dto.slug}" already exists`,
      );
    }

    const document = await this.prisma.legalDocument.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });

    // CRITICAL: Log creation
    await this.logAudit(
      document.id,
      null,
      AuditAction.CREATED,
      userId,
      { document },
      undefined,
      ipAddress,
      userAgent,
    );

    this.logger.log(
      `Created legal document: ${document.title} (${document.id})`,
    );
    return document;
  }

  /**
   * Get all documents (with filters)
   */
  async findAll(filters?: {
    type?: string;
    isActive?: boolean;
    isPublished?: boolean;
  }) {
    return this.prisma.legalDocument.findMany({
      where: {
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.isPublished !== undefined && {
          isPublished: filters.isPublished,
        }),
        deletedAt: null, // Only non-deleted
      },
      include: {
        currentVersion: true,
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get document by ID with full version history
   */
  async findOne(id: string) {
    const document = await this.prisma.legalDocument.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return document;
  }

  /**
   * Get document by slug (for public access)
   */
  async findBySlug(slug: string) {
    const document = await this.prisma.legalDocument.findUnique({
      where: { slug },
      include: {
        currentVersion: true,
      },
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException(`Document with slug "${slug}" not found`);
    }

    // Only return published public documents for non-admin users
    if (!document.isPublished || !document.isPublic) {
      throw new ForbiddenException('This document is not publicly accessible');
    }

    return document;
  }

  /**
   * Update document metadata (NOT content - use createVersion for that)
   * SECURITY: Only ADMIN can update
   */
  async updateDocument(
    id: string,
    dto: UpdateDocumentDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.legalDocument.update({
      where: { id },
      data: dto,
    });

    // CRITICAL: Log update
    await this.logAudit(
      id,
      null,
      AuditAction.METADATA_MODIFIED,
      userId,
      { before: existing, after: updated },
      undefined,
      ipAddress,
      userAgent,
    );

    this.logger.log(`Updated document metadata: ${id}`);
    return updated;
  }

  /**
   * Soft delete document
   * SECURITY: NEVER hard delete - legal compliance requires retention
   */
  async softDeleteDocument(
    id: string,
    userId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findOne(id);

    const deleted = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // CRITICAL: Log deletion
    await this.logAudit(
      id,
      null,
      AuditAction.DELETED,
      userId,
      null,
      reason,
      ipAddress,
      userAgent,
    );

    this.logger.warn(
      `SOFT DELETED document: ${id} by user ${userId}. Reason: ${reason || 'Not specified'}`,
    );
    return { message: 'Document soft deleted successfully', document: deleted };
  }

  /**
   * Create new version of document
   * CRITICAL: Calculates SHA-256 hash for integrity
   */
  async createVersion(
    documentId: string,
    dto: CreateVersionDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findOne(documentId);

    // Get next version number
    const lastVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    const version = `${Math.floor(versionNumber / 100)}.${Math.floor((versionNumber % 100) / 10)}.${versionNumber % 10}`;

    // CRITICAL: Calculate content hash
    const contentHash = this.calculateContentHash(dto.content);

    const newVersion = await this.prisma.documentVersion.create({
      data: {
        documentId,
        version,
        versionNumber,
        content: dto.content,
        contentType: dto.contentType || 'markdown',
        contentHash, // SECURITY: Store hash for verification
        title: dto.title,
        summary: dto.summary,
        changelog: dto.changelog,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        status: VersionStatus.DRAFT,
        createdBy: userId,
      },
    });

    // CRITICAL: Log version creation
    await this.logAudit(
      documentId,
      newVersion.id,
      AuditAction.VERSION_CREATED,
      userId,
      { version: newVersion.version, summary: dto.summary },
      undefined,
      ipAddress,
      userAgent,
    );

    this.logger.log(`Created version ${version} for document ${documentId}`);
    return newVersion;
  }

  /**
   * Publish version (makes it the current active version)
   * CRITICAL: Locks version to prevent tampering
   * SECURITY: Only ADMIN can publish
   */
  async publishVersion(
    documentId: string,
    versionId: string,
    dto: PublishVersionDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const document = await this.findOne(documentId);

    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.documentId !== documentId) {
      throw new NotFoundException('Version not found');
    }

    if (version.isLocked) {
      throw new BadRequestException('Version is locked and cannot be modified');
    }

    if (version.status === VersionStatus.PUBLISHED) {
      throw new BadRequestException('Version is already published');
    }

    // Archive current version if exists
    if (document.currentVersionId) {
      await this.prisma.documentVersion.update({
        where: { id: document.currentVersionId },
        data: {
          status: VersionStatus.ARCHIVED,
          archivedBy: userId,
          archivedAt: new Date(),
          archiveReason: 'Superseded by new version',
        },
      });
    }

    // Publish new version
    const publishedVersion = await this.prisma.documentVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.PUBLISHED,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : new Date(),
        publishedBy: userId,
        publishedAt: new Date(),
        isLocked: true, // CRITICAL: Lock to prevent tampering
        lockedAt: new Date(),
      },
    });

    // Update document's current version
    await this.prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        currentVersionId: versionId,
        isPublished: true,
      },
    });

    // CRITICAL: Log publishing
    await this.logAudit(
      documentId,
      versionId,
      AuditAction.VERSION_PUBLISHED,
      userId,
      { version: publishedVersion.version },
      dto.reason,
      ipAddress,
      userAgent,
    );

    this.logger.log(
      `Published version ${publishedVersion.version} for document ${documentId}`,
    );
    return publishedVersion;
  }

  /**
   * Get audit history for document
   * IMPORTANT: Audit logs are IMMUTABLE - cannot be deleted or modified
   */
  async getAuditHistory(documentId: string) {
    return this.prisma.documentAuditLog.findMany({
      where: { documentId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent 100 entries
    });
  }

  /**
   * Verify content integrity using SHA-256 hash
   * Returns true if content matches stored hash
   */
  async verifyContentIntegrity(versionId: string): Promise<boolean> {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const calculatedHash = this.calculateContentHash(version.content);
    return calculatedHash === version.contentHash;
  }
}
