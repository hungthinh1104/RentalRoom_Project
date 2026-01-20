"use client";

import { Contract } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/hooks/use-session";
import { contractsApi } from "@/features/contracts/api/contracts-api";
import { UserRole, ContractStatus } from "@/types/enums";
import { ContractStepper } from "./details/contract-stepper"; // Add ContractStepper import
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Receipt, Pencil, Send, Ban, Check, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Sub-components
import { ContractHeader } from "./details/contract-header";
import { ContractInfo } from "./details/contract-info";
import { ContractFinancials } from "./details/contract-financials";
import { ContractInvoices } from "./details/contract-invoices";

import { TerminateDialog } from "./terminate-dialog";
import { EditContractDialog } from "./edit-contract-dialog";
import { RenewalDialog } from "./renewal-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRenewContract } from "../hooks/use-contracts";
import { ContractResidents } from "./details/contract-residents";

interface ContractDetailsProps {
    contract: Contract;
    onTerminate: (reason: string, noticeDays: number, terminationType?: string, refundAmount?: number) => Promise<void>;
    isTerminating?: boolean;
}

export function ContractDetails({
    contract,
    onTerminate,
    isTerminating: isTerminatingProp,
}: ContractDetailsProps) {
    const { data: session } = useSession();
    const user = session?.user;

    // States
    const [showRevokeDialog, setShowRevokeDialog] = useState(false);
    const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false);
    const [changeReason, setChangeReason] = useState("");
    const [showTerminateDialog, setShowTerminateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRenewDialog, setShowRenewDialog] = useState(false);

    const [isActionLoading, setIsActionLoading] = useState(false);

    const isLandlord = user?.role === UserRole.LANDLORD || user?.role === UserRole.ADMIN;

    // Mutations
    const renewMutation = useRenewContract();

    // Handlers
    const handleRevokeContract = async () => {
        setIsActionLoading(true);
        try {
            await contractsApi.revokeContract(contract.id);
            toast.success("Đã thu hồi hợp đồng thành công");
            window.location.reload();
        } catch (error) {
            toast.error("Thu hồi thất bại");
            console.error(error);
        } finally {
            setIsActionLoading(false);
            setShowRevokeDialog(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!changeReason.trim()) {
            toast.error("Vui lòng nhập lý do yêu cầu sửa");
            return;
        }
        setIsActionLoading(true);
        try {
            await contractsApi.requestChanges(contract.id, changeReason);
            toast.success("Đã gửi yêu cầu chỉnh sửa");
            window.location.reload();
        } catch (error) {
            toast.error("Gửi yêu cầu thất bại");
            console.error(error);
        } finally {
            setIsActionLoading(false);
            setShowRequestChangesDialog(false);
        }
    };

    const handleSendContract = async () => {
        setIsActionLoading(true);
        try {
            await contractsApi.sendContract(contract.id);
            toast.success("Đã gửi hợp đồng cho khách thuê");
            window.location.reload();
        } catch (error) {
            toast.error("Gửi hợp đồng thất bại");
            console.error(error);
        } finally {
            setIsActionLoading(false);
            setShowSendDialog(false);
        }
    };

    const handleApproveContract = async () => {
        setIsActionLoading(true);
        try {
            await contractsApi.tenantApproveContract(contract.id);
            toast.success("Đã phê duyệt hợp đồng");
            window.location.reload();
        } catch (error) {
            toast.error("Phê duyệt thất bại");
            console.error(error);
        } finally {
            setIsActionLoading(false);
            setShowApproveDialog(false);
        }
    };

    const handleCheckPayment = async () => {
        setIsActionLoading(true);
        try {
            const res = await contractsApi.verifyPaymentStatus(contract.id);
            if (res.success) {
                toast.success("Thanh toán thành công! Hợp đồng đã kích hoạt.");
                window.location.reload();
            } else {
                toast.info("Chưa nhận được thanh toán. Vui lòng thử lại sau ít phút.");
            }
        } catch (error) {
            toast.error("Kiểm tra thanh toán thất bại");
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRenew = async (data: { newEndDate: string; newRentPrice?: number; increasePercentage?: number }) => {
        try {
            await renewMutation.mutateAsync({ id: contract.id, data });
            toast.success("Đã gia hạn hợp đồng thành công!");
            setShowRenewDialog(false);
            window.location.reload(); // Quick refresh to show new state
        } catch (error) {
            console.error(error);
            toast.error("Gia hạn thất bại");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    return (
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <ContractHeader
                contract={contract}
                userRole={user?.role}
                onEdit={() => setShowEditDialog(true)}
                onSend={() => setShowSendDialog(true)}
                onRevoke={() => setShowRevokeDialog(true)}
                onRequestChanges={() => setShowRequestChangesDialog(true)}
                onApprove={() => setShowApproveDialog(true)}
                onCheckPayment={handleCheckPayment}
                onTerminate={() => setShowTerminateDialog(true)}
                isActionLoading={isActionLoading}
            />

            <ContractStepper status={contract.status} />

            {contract.status === ContractStatus.PENDING_SIGNATURE && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5" />
                    <div>
                        <p className="font-semibold">Vui lòng ký hợp đồng</p>
                        <p className="text-sm">Xem kỹ các điều khoản bên dưới và nhấn &quot;Phê duyệt&quot; để tiến hành thanh toán cọc.</p>
                    </div>
                </div>
            )}

            {contract.status === ContractStatus.DEPOSIT_PENDING && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5" />
                    <div>
                        <p className="font-semibold">Chờ thanh toán cọc</p>
                        <p className="text-sm">Hợp đồng đã được ký. Vui lòng hoàn tất thanh toán cọc để kích hoạt hợp đồng.</p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-6">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tổng quan & Điều khoản
                    </TabsTrigger>
                    <TabsTrigger value="residents" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Cư dân
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Hóa đơn & Thanh toán
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <ContractInfo contract={contract} />

                    <ContractFinancials contract={contract} />

                    {/* Terms Section */}
                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Điều khoản hợp đồng
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="prose prose-sm max-w-none text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                                    {contract.terms ? contract.terms : "Không có điều khoản bổ sung đặc biệt."}
                                </div>

                                {/* Action Buttons Area */}
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                                    {/* Renewal Button for Active Contracts */}
                                    {(contract.status === ContractStatus.ACTIVE || contract.status === ContractStatus.EXPIRED) && isLandlord && (
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                            onClick={() => setShowRenewDialog(true)}
                                            disabled={isActionLoading || renewMutation.isPending}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            Gia hạn hợp đồng
                                        </Button>
                                    )}

                                    {/* Landlord Buttons */}
                                    {contract.status === ContractStatus.DRAFT && isLandlord && (
                                        <>
                                            <Button variant="outline" onClick={() => setShowEditDialog(true)} disabled={isActionLoading} className="gap-2">
                                                <Pencil className="w-4 h-4" />
                                                Chỉnh sửa
                                            </Button>
                                            <Button onClick={() => setShowSendDialog(true)} disabled={isActionLoading} className="gap-2">
                                                <Send className="w-4 h-4" />
                                                Gửi cho khách
                                            </Button>
                                        </>
                                    )}

                                    {contract.status === ContractStatus.PENDING_SIGNATURE && isLandlord && (
                                        <Button variant="destructive" onClick={() => setShowRevokeDialog(true)} disabled={isActionLoading} className="gap-2">
                                            <Ban className="w-4 h-4" />
                                            Thu hồi hợp đồng
                                        </Button>
                                    )}

                                    {/* Tenant Buttons */}
                                    {contract.status === ContractStatus.PENDING_SIGNATURE && !isLandlord && (
                                        <>
                                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2" onClick={() => setShowRequestChangesDialog(true)} disabled={isActionLoading}>
                                                <Pencil className="w-4 h-4" />
                                                Yêu cầu sửa
                                            </Button>
                                            <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2" onClick={() => setShowRevokeDialog(true)} disabled={isActionLoading}>
                                                <Ban className="w-4 h-4" />
                                                Từ chối
                                            </Button>
                                            <Button onClick={() => setShowApproveDialog(true)} disabled={isActionLoading} className="gap-2">
                                                <Check className="w-4 h-4" />
                                                Phê duyệt & Ký
                                            </Button>
                                        </>
                                    )}

                                    {contract.status === ContractStatus.DEPOSIT_PENDING && !isLandlord && (
                                        <>
                                            <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2" onClick={() => setShowRevokeDialog(true)} disabled={isActionLoading}>
                                                <Ban className="w-4 h-4" />
                                                Hủy giao dịch
                                            </Button>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handleCheckPayment} disabled={isActionLoading}>
                                                <RefreshCw className={`w-4 h-4 ${isActionLoading ? "animate-spin" : ""}`} />
                                                Tôi đã chuyển khoản
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                <TabsContent value="residents" className="space-y-6">
                    <ContractResidents
                        contract={contract}
                        isOwner={contract.tenant?.userId === user?.id || isLandlord}
                    />
                </TabsContent>

                <TabsContent value="invoices">
                    <ContractInvoices contract={contract} />
                </TabsContent>
            </Tabs>

            {/* --- Dialogs --- */}

            <TerminateDialog
                open={showTerminateDialog}
                onOpenChange={setShowTerminateDialog}
                onConfirm={({ reason, noticeDays, terminationType, refundAmount }) => onTerminate(reason, noticeDays, terminationType, refundAmount)}
                loading={isTerminatingProp}
                isTenant={!isLandlord}
                deposit={Number(contract.deposit)}
                // TODO: Calculate daysRemaining properly
                daysRemaining={30} // Placeholder
            />

            <RenewalDialog
                open={showRenewDialog}
                onOpenChange={setShowRenewDialog}
                onConfirm={handleRenew}
                loading={renewMutation.isPending}
                currentRent={Number(contract.monthlyRent)}
                currentEndDate={contract.endDate}
            />

            <EditContractDialog
                contract={contract}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSuccess={() => window.location.reload()}
            />

            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Phê duyệt hợp đồng thuê?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bằng việc nhấn &quot;Phê duyệt&quot;, bạn đồng ý với tất cả các điều khoản trong hợp đồng.
                            Bước tiếp theo là thanh toán tiền cọc để kích hoạt hợp đồng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionLoading}>Xem lại</AlertDialogCancel>
                        <AlertDialogAction disabled={isActionLoading} onClick={handleApproveContract}>
                            {isActionLoading ? "Đang xử lý..." : "Phê duyệt"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gửi hợp đồng cho khách thuê?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hợp đồng sẽ chuyển sang trạng thái &quot;Chờ khách ký&quot;. Bạn sẽ không thể chỉnh sửa các điều khoản sau khi gửi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionLoading}>Hủy</AlertDialogCancel>
                        <AlertDialogAction disabled={isActionLoading} onClick={handleSendContract}>
                            {isActionLoading ? "Đang gửi..." : "Gửi ngay"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isLandlord ? 'Thu hồi hợp đồng?' : 'Từ chối ký hợp đồng?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn {isLandlord ? 'thu hồi' : 'từ chối'} hợp đồng này? Hợp đồng sẽ chuyển về trạng thái {isLandlord ? 'NHÁP' : 'ĐÃ HỦY'}.
                            Phòng sẽ được mở lại thành &quot;Trống&quot; (Available).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionLoading}>Hủy</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isActionLoading} onClick={handleRevokeContract}>
                            {isActionLoading ? "Đang xử lý..." : `Xác nhận ${isLandlord ? 'thu hồi' : 'từ chối'}`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Tenant Request Changes Dialog */}
            <AlertDialog open={showRequestChangesDialog} onOpenChange={setShowRequestChangesDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yêu cầu chỉnh sửa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vui lòng nhập lý do bạn muốn chỉnh sửa hoặc từ chối hợp đồng này:
                            <textarea
                                className="w-full mt-3 p-3 border rounded-md min-h-[100px]"
                                placeholder="Ví dụ: Sai thông tin CMND, muốn thương lượng lại giá thuê..."
                                value={changeReason}
                                onChange={(e) => setChangeReason(e.target.value)}
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isActionLoading}>Hủy</AlertDialogCancel>
                        <AlertDialogAction disabled={isActionLoading} onClick={handleRequestChanges}>
                            {isActionLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </motion.div>
    );
}
