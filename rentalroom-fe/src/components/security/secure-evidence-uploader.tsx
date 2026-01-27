'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    AlertTriangle,
    Upload,
    FileCheck2,
    Hash,
    Clock,
    Lock,
    X,
    File,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvidenceFile {
    id: string;
    file: File;
    hash: string;
    uploadedAt: Date;
    status: 'pending' | 'uploaded' | 'verified';
}

interface SecureEvidenceUploaderProps {
    /** Maximum files allowed */
    maxFiles?: number;
    /** Maximum file size in MB */
    maxSizeMB?: number;
    /** Deadline for uploads (ISO string) */
    deadline?: string;
    /** Whether uploads are locked (past deadline) */
    isLocked?: boolean;
    /** Callback when files change */
    onFilesChange?: (files: EvidenceFile[]) => void;
    /** Callback to upload file */
    onUpload?: (file: File, hash: string) => Promise<string>;
}

/**
 * 🔒 SECURE EVIDENCE UPLOADER
 *
 * For dispute evidence with:
 * 1. File hash calculation before upload
 * 2. Deadline countdown
 * 3. Lock after deadline
 * 4. Hash preview for integrity verification
 *
 * SECURITY:
 * - Calculates SHA-256 hash client-side
 * - Shows hash before submit
 * - Prevents uploads after deadline
 * - Tracks file integrity
 */
export function SecureEvidenceUploader({
    maxFiles = 5,
    maxSizeMB = 10,
    deadline,
    isLocked = false,
    onFilesChange,
    onUpload,
}: SecureEvidenceUploaderProps) {
    const [files, setFiles] = useState<EvidenceFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate time remaining until deadline
    const deadlineInfo = useMemo(() => {
        if (!deadline) return null;

        const deadlineDate = new Date(deadline);
        const now = new Date();
        const diffMs = deadlineDate.getTime() - now.getTime();

        if (diffMs <= 0) {
            return { expired: true, text: 'Đã hết hạn' };
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return { expired: false, text: `Còn ${days} ngày` };
        }

        return { expired: false, text: `Còn ${hours}h ${minutes}m` };
    }, [deadline]);

    const effectivelyLocked = isLocked || deadlineInfo?.expired;

    // Calculate file hash using Web Crypto API
    const calculateHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (effectivelyLocked) return;

        const selectedFiles = Array.from(e.target.files || []);

        if (files.length + selectedFiles.length > maxFiles) {
            alert(`Tối đa ${maxFiles} tệp`);
            return;
        }

        const newFiles: EvidenceFile[] = [];

        for (const file of selectedFiles) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`${file.name} vượt quá ${maxSizeMB}MB`);
                continue;
            }

            const hash = await calculateHash(file);

            newFiles.push({
                id: crypto.randomUUID(),
                file,
                hash,
                uploadedAt: new Date(),
                status: 'pending',
            });
        }

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (id: string) => {
        if (effectivelyLocked) return;

        const updatedFiles = files.filter((f) => f.id !== id);
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
    };

    const handleUploadAll = async () => {
        if (!onUpload || effectivelyLocked) return;

        setIsUploading(true);

        try {
            for (const evidenceFile of files) {
                if (evidenceFile.status !== 'pending') continue;

                await onUpload(evidenceFile.file, evidenceFile.hash);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === evidenceFile.id ? { ...f, status: 'uploaded' } : f
                    )
                );
            }
        } finally {
            setIsUploading(false);
        }
    };

    const pendingCount = files.filter((f) => f.status === 'pending').length;

    return (
        <Card className={cn(effectivelyLocked && 'opacity-75')}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4" />
                        Tải lên bằng chứng
                    </span>
                    {deadlineInfo && (
                        <Badge
                            variant={deadlineInfo.expired ? 'destructive' : 'secondary'}
                            className="gap-1"
                        >
                            <Clock className="h-3 w-3" />
                            {deadlineInfo.text}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Lock Warning */}
                {effectivelyLocked && (
                    <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded text-sm text-warning">
                        <Lock className="h-4 w-4" />
                        <span>Đã hết hạn nộp bằng chứng</span>
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((evidenceFile) => (
                            <div
                                key={evidenceFile.id}
                                className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <File className="h-4 w-4 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm truncate">{evidenceFile.file.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                            <Hash className="h-3 w-3" />
                                            {evidenceFile.hash.slice(0, 16)}...
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            evidenceFile.status === 'uploaded'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="text-xs"
                                    >
                                        {evidenceFile.status === 'uploaded'
                                            ? 'Đã tải'
                                            : 'Chờ tải'}
                                    </Badge>
                                    {!effectivelyLocked && evidenceFile.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeFile(evidenceFile.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Area */}
                {!effectivelyLocked && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                                'hover:border-primary hover:bg-primary/5'
                            )}
                        >
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Click để chọn tệp ({files.length}/{maxFiles})
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Tối đa {maxSizeMB}MB mỗi tệp
                            </p>
                        </div>
                    </>
                )}

                {/* Upload Button */}
                {pendingCount > 0 && !effectivelyLocked && (
                    <Button
                        className="w-full"
                        onClick={handleUploadAll}
                        disabled={isUploading}
                    >
                        {isUploading
                            ? 'Đang tải lên...'
                            : `Tải lên ${pendingCount} tệp`}
                    </Button>
                )}

                {/* Integrity Notice */}
                <p className="text-xs text-muted-foreground">
                    ⚠️ Hash SHA-256 được tính trước khi tải lên để đảm bảo tính toàn vẹn.
                </p>
            </CardContent>
        </Card>
    );
}
