'use client';

import { useState } from 'react';
import { Upload, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface AvatarUploadProps {
    currentAvatar?: string;
    onUploadComplete: (url: string) => void;
    disabled?: boolean;
}

export function AvatarUpload({ currentAvatar, onUploadComplete, disabled }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn file ảnh',
                variant: 'destructive',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Lỗi',
                description: 'Kích thước ảnh không được vượt quá 5MB',
                variant: 'destructive',
            });
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server (placeholder - implement ImageKit later)
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            // Upload to backend
            // Backend endpoint: POST /api/v1/users/me/avatar
            // Accepts: multipart/form-data with 'file' field
            // Validates: JPEG/PNG/WebP, max 5MB
            // Returns: { message, avatarUrl }

            const response = await fetch(`${config.api.url}/v1/users/me/avatar`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onUploadComplete(data.avatarUrl || reader.result as string);
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật ảnh đại diện',
            });
            setUploading(false);
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tải ảnh lên',
                variant: 'destructive',
            });
            setUploading(false);
            setPreview(null);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadComplete('');
    };

    const displayAvatar = preview || currentAvatar;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted border-4 border-border overflow-hidden flex items-center justify-center">
                    {displayAvatar ? (
                        <Image
                            src={displayAvatar}
                            alt="Avatar"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-16 h-16 text-muted-foreground" />
                    )}
                </div>

                {displayAvatar && !disabled && (
                    <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-0 right-0 h-8 w-8 rounded-full"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
                <label htmlFor="avatar-upload">
                    <Button
                        variant="outline"
                        disabled={disabled || uploading}
                        className="cursor-pointer"
                        asChild
                    >
                        <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                        </span>
                    </Button>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled || uploading}
                    />
                </label>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Định dạng: JPG, PNG. Tối đa 5MB
            </p>
        </div>
    );
}
