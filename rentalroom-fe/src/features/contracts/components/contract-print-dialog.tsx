"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, FileText, Loader2 } from "lucide-react";
import { ContractDocument } from "./contract-document";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/features/contracts/api/contracts-api";
import { toast } from "sonner";

interface ContractPrintDialogProps {
    contractId: string; // Changed from passing full object to ID to ensure fetch
    contractNumber?: string; // Optional for title before loading
    trigger?: React.ReactNode;
}

export function ContractPrintDialog({ contractId, contractNumber, trigger }: ContractPrintDialogProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    // Fetch full details when dialog is open
    const { data: contract, isLoading, isError } = useQuery({
        queryKey: ["contract-pdf-detail", contractId],
        queryFn: () => contractsApi.getContractById(contractId),
        enabled: open, // Only fetch when dialog opens
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
        retry: 1,
    });

    const handlePrint = useReactToPrint({
        contentRef: contentRef,
        documentTitle: `Hop-dong-${contract?.contractNumber || contractId}`,
        onAfterPrint: () => {
            toast.success("Đã gửi lệnh in thành công");
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" className="w-full justify-start cursor-pointer">
                        <Printer className="mr-2 h-4 w-4" />
                        Xuất PDF
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-6xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b shrink-0 bg-white z-10">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Xem trước & In Hợp đồng {contractNumber ? ` - ${contractNumber}` : ""}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-muted/50 p-4 md:p-8 relative w-full h-full">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu hợp đồng đầy đủ...</p>
                            </div>
                        </div>
                    ) : isError || !contract ? (
                        <div className="flex flex-col items-center justify-center h-full text-destructive">
                            <p>Không thể tải dữ liệu chi tiết hợp đồng.</p>
                            <p className="text-sm">Vui lòng thử lại sau.</p>
                        </div>
                    ) : (
                        <div className="flex justify-center min-w-fit pb-10">
                            {/* Render the Document here */}
                            <div className="bg-white shadow-2xl">
                                <ContractDocument ref={contentRef} contract={contract} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 gap-2 border-t bg-white">
                    <Button variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
                    <Button
                        onClick={() => handlePrint()}
                        disabled={isLoading || isError || !contract}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Printer className="mr-2 h-4 w-4 relative z-10" />
                        <span className="relative z-10">In ngay / Lưu PDF</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
