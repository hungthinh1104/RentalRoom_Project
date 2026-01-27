'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, ExternalLink, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SnapshotReferenceProps {
    /** Snapshot ID (UUID) */
    snapshotId: string;
    /** Entity type */
    entityType: 'CONTRACT' | 'INVOICE' | 'DISPUTE' | 'PAYMENT';
    /** When the snapshot was created */
    createdAt: string | Date;
    /** Optional: Link to audit trail */
    auditUrl?: string;
    /** Compact mode (just badge) */
    compact?: boolean;
    /** Optional: Hash for integrity verification */
    hash?: string;
}

/**
 * 🔒 SNAPSHOT REFERENCE COMPONENT
 *
 * Displays legal snapshot information:
 * 1. Unique reference ID
 * 2. Creation timestamp
 * 3. Link to full audit trail
 * 4. Optional integrity hash
 *
 * Shows users that their action was:
 * - Recorded immutably
 * - Timestamped
 * - Traceable
 */
export function SnapshotReference({
    snapshotId,
    entityType,
    createdAt,
    auditUrl,
    compact = false,
    hash,
}: SnapshotReferenceProps) {
    const shortId = snapshotId.slice(0, 8).toUpperCase();
    const timestamp =
        createdAt instanceof Date ? createdAt : new Date(createdAt);

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            className="font-mono text-xs cursor-help gap-1"
                        >
                            <Shield className="h-3 w-3" />
                            {shortId}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <div className="space-y-1 text-xs">
                            <p className="font-semibold">Snapshot Reference</p>
                            <p className="font-mono">{snapshotId}</p>
                            <p className="text-muted-foreground">
                                {timestamp.toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Ghi nhận pháp lý
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Reference ID */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Reference ID:</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="font-mono">
                                    {shortId}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-mono text-xs">{snapshotId}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Thời gian:
                    </span>
                    <span className="text-xs">{timestamp.toLocaleString('vi-VN')}</span>
                </div>

                {/* Hash (if provided) */}
                {hash && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Integrity:
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {hash.slice(0, 12)}...
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-mono text-xs break-all max-w-xs">
                                        {hash}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                {/* Audit Link */}
                {auditUrl && (
                    <a
                        href={auditUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline pt-1"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Xem lịch sử thay đổi
                    </a>
                )}

                {/* Legal Notice */}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                    Hành động này đã được ghi nhận và lưu trữ theo quy định pháp luật.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Inline version for use in success toasts/messages
 */
export function SnapshotReferenceInline({
    snapshotId,
}: {
    snapshotId: string;
}) {
    const shortId = snapshotId.slice(0, 8).toUpperCase();

    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Ref: <span className="font-mono">{shortId}</span>
        </span>
    );
}
