import Image from "next/image";

import { IKContext, IKImage } from "imagekitio-react";
import ImageKit from "imagekit-javascript";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ImagePlus, Camera, X, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    maxFiles?: number;
    fileNamePrefix?: string;
}

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

// Use internal Next.js API route for secure signature generation
const authenticationEndpoint = "/api/imagekit/auth";

export function ImageUpload({ value = [], onChange, maxFiles = 5, fileNamePrefix }: ImageUploadProps) {
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string; file: File; progress: number; preview: string }[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedQueue, setCapturedQueue] = useState<string[]>([]);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalCount = value.length + uploadingFiles.length;

    // Helper: Convert DataURL to File
    const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[arr.length - 1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const authenticator = async () => {
        try {
            const authUrl = new URL(authenticationEndpoint);
            authUrl.searchParams.append("t", Date.now().toString());

            const response = await fetch(authUrl.toString(), {
                mode: "cors",
                credentials: "include",
            });

            if (!response.ok) throw new Error(await response.text());
            return await response.json();
        } catch (error: unknown) {
            console.error("Auth error:", error);
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Authentication failed: ${msg}`);
        }
    };

    const uploadFile = async (file: File, id: string) => {
        try {
            // @ts-expect-error - ImageKit types
            const imagekit = new ImageKit({ publicKey, urlEndpoint });
            const authParams = await authenticator();
            const baseName = fileNamePrefix ? slugify(fileNamePrefix) : "upload";
            const apiFileName = `${baseName}_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop() || 'jpg'}`;

            const res = await new Promise<{ url: string }>((resolve, reject) => {
                imagekit.upload({
                    file,
                    fileName: apiFileName,
                    tags: ["user-upload", baseName],
                    token: (authParams as { token: string }).token,
                    signature: (authParams as { signature: string }).signature,
                    expire: (authParams as { expire: number }).expire,
                    useUniqueFileName: false // We handle naming
                }, (err: Error | null, result: { url: string } | null) => {
                    if (err) reject(err);
                    else if (result) resolve(result);
                    else reject(new Error("Upload failed: No result"));
                });
            });

            // On success
            setUploadingFiles(prev => prev.filter(p => p.id !== id));
            // We need to use functional update based on latest value prop? 
            // Actually, value prop might not be updated yet. We need a way to chain updates safely.
            // But here we rely on parent updating 'value'. 
            // NOTE: This race condition is tricky if multiple files finish same time.
            // Better to use a callback that receives the NEW url and append it.
            // Ideally onChange should append.
            // For now, let's assume parent state update is fast enough or use a functional update approach if we controlled state.
            // Since we don't control 'value', we just call onChange with [...value, newUrl].
            // BUT: 'value' in closure might be stale.
            // FIX: We can't easily fix stale closure of 'value' inside async without ref.
            // So we'll use a queue approach or functional update if possible.
            // Actually, we can just pass a function to onChange if supported? No.

            return res.url;
        } catch (err) {
            console.error("Upload failed", err);
            toast.error(`Lỗi tải lên: ${file.name}`);
            setUploadingFiles(prev => prev.filter(p => p.id !== id));
            return null;
        }
    };

    // Robust file handling with sequential processing to avoid race conditions on 'value'
    // Actually, parallel uploads are better UX. We can solve stale state by using a Ref for current values
    // or by accumulating results.
    // Let's use a "processing" queue.

    // BETTER APPROACH: Upload immediately, get URL.
    // But how to update 'value' safely?
    // We can chain the updates?

    // For simplicity and safety given the constraints:
    // We will upload files one by one to ensure state consistency? Or handle parallel but update state carefully.
    // Actually, let's try to upload, then when ALL valid finished in this batch, update parent?
    // No, users want to see them appear one by one.

    // Fix: We'll maintain a local list of committed URLs + pending uploads?
    // No, parent owns the state.

    // Let's use a ref to track the latest 'value' from props to avoid stale closures in async callbacks.
    const valueRef = useRef(value);
    useEffect(() => { valueRef.current = value; }, [value]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const availableSlots = maxFiles - (valueRef.current.length + uploadingFiles.length); // approx

            if (files.length > availableSlots) {
                toast.error(`Chỉ có thể thêm ${availableSlots} ảnh nữa.`);
                return;
            }

            const newUploads = files.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                progress: 0,
                preview: URL.createObjectURL(file)
            }));

            setUploadingFiles(prev => [...prev, ...newUploads]);
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Start uploads in parallel
            // We need to be careful about updating 'onChange' multiple times rapidly.
            // Ideally we wait for all to finish then update once? Or update incrementally?
            // Incrementally is better feedback.

            // To avoid race conditions with `onChange([...value, url])`, we can use a mutex or chain.
            // Simple hack: Process linearly or simple optimistic lock.
            // Let's simply invoke each upload. Upon completion, read FRESH valueRef.

            const results: string[] = [];

            await Promise.all(newUploads.map(async (upload) => {
                const url = await uploadFile(upload.file, upload.id);
                if (url) {
                    // We have a URL. We want to add it.
                    // We cannot just call onChange here repeatedly if multiple finish at once.
                    // So we push to results.
                    results.push(url);
                }
            }));

            if (results.length > 0) {
                // Update parent ONCE with all new results
                onChange([...valueRef.current, ...results]);
                toast.success(`Đã tải lên ${results.length} ảnh.`);
            }
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedQueue(prev => [...prev, imageSrc]);
        }
    }, [webcamRef]);

    const confirmCapture = async () => {
        const availableSlots = maxFiles - (value.length + uploadingFiles.length);
        if (capturedQueue.length > availableSlots) {
            toast.error(`Quá số lượng cho phép. Chỉ còn ${availableSlots} chỗ.`);
            return;
        }

        const newUploads = capturedQueue.map((base64, idx) => {
            const file = dataURLtoFile(base64, `capture_${Date.now()}_${idx}.jpg`);
            return {
                id: Math.random().toString(36).substring(7),
                file,
                progress: 0,
                preview: base64
            };
        });

        setUploadingFiles(prev => [...prev, ...newUploads]);
        setCapturedQueue([]);
        setShowCamera(false);

        const results: string[] = [];
        await Promise.all(newUploads.map(async (upload) => {
            const url = await uploadFile(upload.file, upload.id);
            if (url) results.push(url);
        }));

        if (results.length > 0) {
            onChange([...valueRef.current, ...results]);
            toast.success(`Đã tải lên ${results.length} ảnh.`);
        }
    };

    const configValid = urlEndpoint && publicKey && authenticationEndpoint;
    if (!configValid) return <div className="text-destructive">Lỗi cấu hình ImageKit</div>;

    return (
        <IKContext publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* 1. Existing Uploaded URLs */}
                    {value.map((url, index) => (
                        <div key={url + index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group animate-in fade-in zoom-in-50 duration-300">
                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button variant="destructive" size="icon" className="h-6 w-6 shadow-sm" onClick={async () => {
                                    // Optimistic UI update
                                    onChange(value.filter(u => u !== url));
                                    try {
                                        // Call backend to delete file
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                                        const endpoint = apiUrl.endsWith("/api/v1") ? `${apiUrl}/upload/delete` : `${apiUrl}/api/v1/upload/delete`;
                                        await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
                                        toast.success("Đã xóa ảnh.");
                                    } catch (e) {
                                        console.error("Delete error", e);
                                        toast.error("Không thể xóa ảnh trên server");
                                    }
                                }} type="button">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Reorder Buttons */}
                            <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0"
                                    disabled={index === 0}
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); const n = [...value];[n[index - 1], n[index]] = [n[index], n[index - 1]]; onChange(n); }}>
                                    <ArrowLeft className="h-3 w-3" />
                                </Button>
                                <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0"
                                    disabled={index === value.length - 1}
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); const n = [...value];[n[index + 1], n[index]] = [n[index], n[index + 1]]; onChange(n); }}>
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </div>

                            {index === 0 && <div className="absolute top-2 left-2 z-20 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">Ảnh bìa</div>}

                            <IKImage urlEndpoint={urlEndpoint} src={url} transformation={[{ height: "300", width: "300" }]} className="object-cover w-full h-full transition-transform group-hover:scale-105" alt="Room image" />
                        </div>
                    ))}

                    {/* 2. Uploading Files (Progress / Skeleton) */}
                    {uploadingFiles.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-muted bg-muted/50 group">
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 p-4 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                <span className="text-xs font-semibold text-white">Đang tải lên...</span>
                            </div>
                            <Image src={item.preview} className="object-cover w-full h-full opacity-60 blur-[1px]" alt="Preview" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        </div>
                    ))}

                    {/* 3. Add Button */}
                    {totalCount < maxFiles && (
                        <div className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="flex gap-2 justify-center w-full pointer-events-none group-hover:scale-110 transition-transform">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted group-hover:bg-background transition-colors">
                                    <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">Thêm ảnh</span>

                            {/* Hidden separate camera trigger */}
                            <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-background rounded-full" onClick={(e) => { e.stopPropagation(); setShowCamera(true); setCapturedQueue([]); }} type="button" title="Chụp ảnh">
                                    <Camera className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                            </div>

                            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                        </div>
                    )}
                </div>

                {/* Camera Dialog */}
                {showCamera && (
                    <Dialog open={showCamera} onOpenChange={setShowCamera}>
                        <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-black border-zinc-800 text-white overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] md:rounded-xl">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Camera</DialogTitle>
                                <DialogDescription>Chụp ảnh để tải lên</DialogDescription>
                            </DialogHeader>
                            {/* Close Button */}
                            <div className="absolute top-4 right-4 z-50">
                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md" onClick={() => setShowCamera(false)}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Camera Viewfinder */}
                            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment", aspectRatio: 3 / 4 }}
                                    className="w-full h-full object-contain"
                                    mirrored={false}
                                />
                            </div>

                            {/* Controls */}
                            <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe pt-4 px-6 flex flex-col gap-4">
                                {/* Film Strip */}
                                {capturedQueue.length > 0 && (
                                    <div className="h-20 flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                        {capturedQueue.map((img, idx) => (
                                            <div key={idx} className="relative h-full aspect-[3/4] flex-shrink-0 rounded-md overflow-hidden border border-white/20 snap-start animate-in zoom-in-50 duration-200">
                                                <Image src={img} alt="" className="w-full h-full object-cover" fill sizes="100px" />
                                                <button
                                                    onClick={() => setCapturedQueue(q => q.filter((_, i) => i !== idx))}
                                                    className="absolute top-0 right-0 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-bl-md"
                                                    type="button"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between h-24">
                                    <div className="w-20 flex justify-start">
                                        {capturedQueue.length > 0 && (
                                            <span className="text-xl font-bold">{capturedQueue.length} ảnh</span>
                                        )}
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <button
                                            onClick={capture}
                                            className="relative group cursor-pointer transition-transform active:scale-95"
                                            title="Chụp ảnh"
                                            type="button"
                                        >
                                            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center bg-transparent group-hover:border-white/50 transition-colors">
                                                <div className="w-16 h-16 rounded-full bg-white group-active:bg-red-500 transition-colors shadow-lg" />
                                            </div>
                                        </button>
                                    </div>
                                    <div className="w-20 flex justify-end">
                                        {capturedQueue.length > 0 && (
                                            <Button
                                                onClick={confirmCapture}
                                                variant="secondary"
                                                className="rounded-full px-6 font-semibold bg-white text-black hover:bg-zinc-200"
                                                type="button"
                                            >
                                                Xong
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </IKContext>
    );
}
