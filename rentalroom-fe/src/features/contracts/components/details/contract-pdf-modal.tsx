import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getContractPdf } from "@/features/contracts/api/contracts-api";
import { toast } from "sonner";
import api from "@/lib/api/client"; // Use the configured axios instance

interface ContractPdfModalProps {
    contractId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContractPdfModal({ contractId, open, onOpenChange }: ContractPdfModalProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;

        const fetchPdf = async () => {
            if (!open) return;

            setIsLoading(true);
            setError(null);
            try {
                // Use the configured axios client to ensure auth headers/cookies are sent
                // We request 'blob' response type
                const response = await api.get(`/contracts/${contractId}/pdf`, {
                    responseType: 'blob'
                });

                // Cast response.data to unknown then BlobPart to satisfy TS
                const blob = new Blob([response.data as unknown as BlobPart], { type: 'application/pdf' });
                objectUrl = URL.createObjectURL(blob);
                setPdfUrl(objectUrl);
            } catch (err) {
                console.error("Failed to load PDF preview", err);
                setError("Không thể tải bản xem trước PDF (Lỗi xác thực hoặc Server)");
                // toast.error("Không thể tải PDF preview");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPdf();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [contractId, open]);

    const handleDownload = () => {
        if (pdfUrl) {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = `contract-${contractId}.pdf`;
            a.click();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {/* This trigger is optional; we use external button to open */}
                <span className="hidden" />
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Preview PDF</DialogTitle>
                </DialogHeader>

                <div className="w-full h-[80vh] border rounded-md bg-muted/20 flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Đang tải PDF...</p>
                        </div>
                    ) : error ? (
                        <div className="text-destructive font-medium p-4 text-center">
                            {error}
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title="Contract PDF Preview"
                        />
                    ) : null}
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Đóng
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={!pdfUrl || isLoading}
                    >
                        Tải xuống PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

