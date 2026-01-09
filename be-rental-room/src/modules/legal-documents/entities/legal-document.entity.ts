import { DocumentType, VersionStatus, AuditAction } from '@prisma/client';

export { DocumentType, VersionStatus, AuditAction };

// Re-export for convenience
export const DOCUMENT_TYPES = Object.values(DocumentType);
export const VERSION_STATUSES = Object.values(VersionStatus);
export const AUDIT_ACTIONS = Object.values(AuditAction);
