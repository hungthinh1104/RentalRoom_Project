"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiabilityWaiverModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAgree: () => void;
}

export function LiabilityWaiverModal({ open, onOpenChange, onAgree }: LiabilityWaiverModalProps) {
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if scrolled to bottom with 20px tolerance
        if (scrollHeight - scrollTop - clientHeight < 20) {
            setHasReadToBottom(true);
        }
    };

    const handleConfirm = () => {
        if (agreed) {
            onAgree();
            onOpenChange(false);
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasReadToBottom(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAgreed(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-warning/20 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-warning/10 text-warning">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl">Khước từ trách nhiệm pháp lý</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-muted-foreground">
                        Vui lòng đọc và xác nhận các điều khoản sau trước khi tạo hồ sơ PCCC.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 border rounded-md bg-muted/30">
                    <ScrollArea
                        className="h-[300px] p-4 rounded-md"
                        onScrollCapture={handleScroll}
                    >
                        <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                1. Mục đích sử dụng
                            </h4>
                            <p>
                                Công cụ &quot;AI PCCC Consultant&quot; (&quot;Công cụ&quot;) được cung cấp nhằm mục đích hỗ trợ người dùng tạo lập các tài liệu tham khảo ban đầu cho hồ sơ Phòng cháy chữa cháy (PCCC).
                                <strong className="text-primary block mt-1">
                                    Mọi tài liệu được tạo ra từ Công cụ này CHỈ MANG TÍNH CHẤT THAM KHẢO.
                                </strong>
                            </p>

                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                2. Không phải tư vấn pháp lý
                            </h4>
                            <p>
                                Các thông tin, gợi ý và tài liệu do Công cụ cung cấp không thay thế cho sự tư vấn chuyên môn của các cơ quan chức năng, luật sư hoặc chuyên gia PCCC được cấp phép.
                                Chúng tôi không đảm bảo tính chính xác tuyệt đối, đầy đủ hoặc cập nhật của các quy định pháp luật.
                            </p>

                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                3. Trách nhiệm người dùng
                            </h4>
                            <p>
                                Người dùng hoàn toàn chịu trách nhiệm về việc sử dụng, kiểm chứng và nộp hồ sơ PCCC.
                                Bạn cam kết sẽ tự rà soát lại các thông tin, điều chỉnh cho phù hợp với thực tế cơ sở và tuân thủ các hướng dẫn của Cảnh sát PCCC địa phương.
                            </p>

                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                4. Miễn trừ trách nhiệm
                            </h4>
                            <p>
                                Đội ngũ phát triển, chủ sở hữu nền tảng RentalRoom và các bên liên quan được MIỄN TRỪ HOÀN TOÀN TRÁCH NHIỆM đối với bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc hệ quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng Công cụ này, bao gồm cả việc hồ sơ bị từ chối hoặc các vấn đề pháp lý phát sinh.
                            </p>

                            <p className="pt-4 text-center italic text-muted-foreground border-t">
                                Bằng việc nhấn &quot;Đồng ý&quot;, bạn xác nhận đã hiểu rõ và chấp nhận các điều khoản trên.
                            </p>
                        </div>
                    </ScrollArea>
                </div>

                <div className="space-y-4">
                    <div className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
                        hasReadToBottom ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent opacity-50 pointer-events-none"
                    )}>
                        <Checkbox
                            id="terms"
                            checked={agreed}
                            onCheckedChange={(c) => setAgreed(!!c)}
                            disabled={!hasReadToBottom}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Tôi đã đọc, hiểu và đồng ý với các điều khoản trên
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {hasReadToBottom ? "Bạn có thể xác nhận ngay bây giờ." : "Vui lòng cuộn xuống cuối nội dung để kích hoạt."}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            className="bg-warning hover:bg-warning/90 text-white min-w-[140px]"
                            disabled={!agreed}
                            onClick={handleConfirm}
                        >
                            {agreed ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Xác nhận & Tiếp tục
                                </>
                            ) : (
                                "Vui lòng đồng ý"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
