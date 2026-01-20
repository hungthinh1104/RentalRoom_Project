import * as React from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationStatus, type RentalApplication } from "@/types";
import { ApplicationStatusBadge } from "./application-status-badge";
import { useApproveApplication, useRejectApplication, useWithdrawApplication } from "../hooks/use-rental-applications";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Props = {
    application: RentalApplication | null;
    isOpen: boolean;
    onClose: () => void;
};

export function ApplicationDetailDrawer({ application, isOpen, onClose }: Props) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const isLandlord = application?.room?.property?.landlord?.userId === userId || application?.landlordId === userId;
    const isTenant = application?.tenantId === userId;

    const { toast } = useToast();
    const approveMutation = useApproveApplication();
    const rejectMutation = useRejectApplication();
    const withdrawMutation = useWithdrawApplication();

    const [rejectReason, setRejectReason] = React.useState("");
    const [showRejectInput, setShowRejectInput] = React.useState(false);

    const onApprove = async () => {
        if (!application) return;
        try {
            await approveMutation.mutateAsync(application.id);
            toast({ title: "Đã duyệt đơn", description: "Đơn đăng ký đã được chấp thuận." });
            onClose();
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể duyệt đơn.", variant: "destructive" });
        }
    };

    const onReject = async () => {
        if (!application) return;
        try {
            await rejectMutation.mutateAsync({ id: application.id, reason: rejectReason });
            toast({ title: "Đã từ chối", description: "Đơn đăng ký đã bị từ chối." });
            setShowRejectInput(false);
            onClose();
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể từ chối.", variant: "destructive" });
        }
    };

    const onWithdraw = async () => {
        if (!application) return;
        try {
            await withdrawMutation.mutateAsync(application.id);
            toast({ title: "Đã rút đơn", description: "Đơn đăng ký đã hủy." });
            onClose();
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể rút đơn.", variant: "destructive" });
        }
    };

    if (!application) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Chi tiết đơn đăng ký</SheetTitle>
                    <SheetDescription>
                        Được tạo vào {format(new Date(application.createdAt), "dd/MM/yyyy HH:mm")}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 text-sm">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Trạng thái</span>
                        <ApplicationStatusBadge status={application.status} />
                    </div>

                    <Separator />

                    {/* Room Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-base">Thông tin phòng</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Phòng số</span>
                            <span className="col-span-2 font-medium">{application.room?.roomNumber ?? application.roomNumber ?? "—"}</span>

                            <span className="text-muted-foreground">Địa chỉ</span>
                            <span className="col-span-2 font-medium">{application.room?.property?.address ?? application.roomAddress ?? "—"}</span>

                            <span className="text-muted-foreground">Giá thuê</span>
                            <span className="col-span-2 font-medium text-indigo-600">
                                {application.room?.pricePerMonth
                                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(application.room.pricePerMonth)
                                    : "—"}/tháng
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Tenant Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-base">Thông tin người thuê</h4>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${application.tenant?.user?.fullName ?? application.tenantName ?? "T"}`} />
                                <AvatarFallback>{(application.tenant?.user?.fullName ?? application.tenantName ?? "T").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{application.tenant?.user?.fullName ?? application.tenantName ?? "—"}</div>
                                <div className="text-muted-foreground text-xs">{application.tenant?.user?.email ?? application.tenantEmail ?? "—"}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <span className="text-muted-foreground">Số điện thoại</span>
                            <span className="col-span-2">{application.tenant?.user?.phoneNumber ?? application.tenantPhone ?? "—"}</span>

                            <span className="text-muted-foreground">Lời nhắn</span>
                            <span className="col-span-2 italic text-muted-foreground">&quot;{application.message ?? "Không có lời nhắn"}&quot;</span>
                        </div>
                    </div>

                    {/* Actions Area */}
                    {!showRejectInput && application.status === ApplicationStatus.PENDING && (isLandlord || !isTenant) && (
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button onClick={onApprove} disabled={approveMutation.isPending} className="w-full bg-success hover:bg-success/90">
                                Duyệt đơn
                            </Button>
                            <Button variant="destructive" onClick={() => setShowRejectInput(true)} disabled={rejectMutation.isPending} className="w-full">
                                Từ chối
                            </Button>
                        </div>
                    )}

                    {showRejectInput && (
                        <div className="space-y-3 mt-4 bg-muted/30 p-4 rounded-lg">
                            <h4 className="font-medium">Lý do từ chối</h4>
                            <Textarea
                                placeholder="Nhập lý do từ chối..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>Hủy</Button>
                                <Button variant="destructive" size="sm" onClick={onReject} disabled={!rejectReason}>Xác nhận từ chối</Button>
                            </div>
                        </div>
                    )}

                    {application.status === ApplicationStatus.PENDING && isTenant && (
                        <Button variant="destructive" onClick={onWithdraw} disabled={withdrawMutation.isPending} className="w-full mt-6">
                            Rút đơn đăng ký
                        </Button>
                    )}

                    {application.status === ApplicationStatus.APPROVED && (isLandlord || !isTenant) && !application.contractId && (
                        <Link href={`/dashboard/landlord/contracts/create?applicationId=${application.id}`} className="block mt-6">
                            <Button className="w-full h-12 text-base shadow-lg bg-indigo-600 hover:bg-indigo-700">
                                Tạo hợp đồng ngay
                            </Button>
                        </Link>
                    )}

                    {/* If Contract Exists */}
                    {application.contractId && (
                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg flex flex-col items-center gap-2">
                            <span className="font-medium">Hợp đồng đã được tạo</span>
                            <Link href={`/contracts/${application.contractId}`}>
                                <Button variant="link" className="text-blue-700 underline h-auto p-0">Xem hợp đồng</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
