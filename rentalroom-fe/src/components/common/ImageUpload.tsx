"use client";

import { useState, useRef } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import api from "@/lib/api/client";

interface ImageKitUploadResponse {
    url: string;
    fileId: string;
    [key: string]: unknown;
}

interface ImageKitError {
    message: string;
    [key: string]: unknown;
}

interface ImageUploadProps {
    onSuccess: (url: string, fileId: string) => void;
    onError?: (err: ImageKitError) => void;
    folder?: string;
    className?: string;
    value?: string; // Current image URL
    onRemove?: () => void;
}

// Authentication function for ImageKit
const authenticator = async () => {
    try {
        // Determine the base URL. If we are in browser, use relative path or env
        // Our api client handles the base URL (e.g. /api/v1)
        // But IKContext might need a full URL or a fetch function. 
        // Let's use the explicit fetch to our backend proxy/endpoint.
        const response = await api.get<{ Signature: string; Expire: number; Token: string }>("/upload/auth");
        const { Signature, Expire, Token } = response.data;
        return { signature: Signature, expire: Expire, token: Token };
    } catch (error) {
        console.error("ImageKit Auth Error", error);
        throw new Error("Authentication failed");
    }
};

export function ImageUpload({ onSuccess, onError, folder = "/properties", value, onRemove, className }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const onErrorHandler = (err: ImageKitError) => {
        setIsUploading(false);
        toast.error("Upload failed", { description: err.message });
        if (onError) onError(err);
    };

    const onSuccessHandler = (res: ImageKitUploadResponse) => {
        setIsUploading(false);
        toast.success("Image uploaded successfully");
        // res contains { url, fileId, ... }
        onSuccess(res.url, res.fileId);
    };

    return (
        <IKContext
            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
            authenticator={authenticator}
        >
            <div className={`relative ${className}`}>
                {value ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20 group">
                        <Image
                            src={value}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="icon"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove?.();
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => inputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-sm text-muted-foreground">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground">
                                <div className="p-3 rounded-full bg-muted/30 group-hover:bg-primary/10 transition-colors">
                                    <UploadCloud className="w-6 h-6 group-hover:text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Click to upload</p>
                                    <p className="text-xs text-muted-foreground/70">JPG, PNG, WebP up to 5MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <IKUpload
                    ref={inputRef}
                    className="hidden"
                    folder={folder}
                    onError={onErrorHandler}
                    onSuccess={onSuccessHandler}
                    validateFile={(file: File) => file.size < 5000000} // 5MB
                />
            </div>
        </IKContext>
    );
}
