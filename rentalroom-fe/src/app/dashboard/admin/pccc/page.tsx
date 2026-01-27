"use client";

import { useState } from "react";
import { Eye, ShieldCheck, AlertTriangle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { PCCCReport } from "@/features/pccc/types/pccc.types";
import { RiskScoreDisplay } from "@/features/pccc/components/RiskScoreDisplay";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPCCCPage() {
    const [selectedReport, setSelectedReport] = useState<PCCCReport | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch all reports
    const { data: reports, isLoading } = useQuery({
        queryKey: ["admin", "pccc", "reports"],
        queryFn: async () => {
            const res = await api.get<PCCCReport[]>("/pccc/admin/reports");
            return res.data;
        },
    });

    const openDetails = (report: PCCCReport) => {
        setSelectedReport(report);
        setIsDetailsOpen(true);
    };

    const getScoreBadge = (score: number) => {
        if (score >= 90) return <Badge className="bg-success text-success-foreground">Đạt Chuẩn ({score})</Badge>;
        if (score >= 60) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Cảnh Báo ({score})</Badge>;
        return <Badge variant="destructive">Nguy Hiểm ({score})</Badge>;
    };

    return (
        <div className="container py-8 max-w-[1600px] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Giám Sát PCCC</h1>
                    <p className="text-muted-foreground mt-2">
                        Theo dõi tình trạng tuân thủ PCCC của toàn bộ hệ thống
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh Sách Hồ Sơ PCCC</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Địa Chỉ Bất Động Sản</TableHead>
                                    <TableHead>Loại Hình</TableHead>
                                    <TableHead>Điểm An Toàn</TableHead>
                                    <TableHead>Ngày Tạo</TableHead>
                                    <TableHead>Trạng Thái</TableHead>
                                    <TableHead className="text-right">Hành Động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports?.map((report: PCCCReport) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium max-w-[300px] truncate" title={report.propertyId}>
                                            {/* Ideally fetch property address or name */}
                                            {report.propertyId}
                                        </TableCell>
                                        <TableCell>
                                            {report.propertyType === 'NHA_TRO' ? 'Nhà Trọ' :
                                                report.propertyType === 'CHUNG_CU_MINI' ? 'Chung Cư Mini' : 'Kinh Doanh'}
                                        </TableCell>
                                        <TableCell>
                                            {getScoreBadge(report.complianceScore)}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{report.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openDetails(report)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {reports?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Chưa có hồ sơ nào.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Chi Tiết Hồ Sơ PCCC</DialogTitle>
                        <DialogDescription>
                            Mã hồ sơ: {selectedReport?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Loại hình</span>
                                    <p className="font-medium">{selectedReport.propertyType}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Ngày hết hạn</span>
                                    <p className="font-medium">{new Date(selectedReport.expiryDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            <RiskScoreDisplay
                                score={selectedReport.complianceScore}
                                status={selectedReport.status === 'ACTIVE' ? 'PASS' : 'FAIL'}
                                loading={false}
                            />

                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    Yêu cầu PCCC
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {selectedReport.requirements.fireExtinguishers.map((ext, idx) => (
                                        <li key={idx}>🧯 {ext.type}: {ext.quantity} {ext.unit}</li>
                                    ))}
                                    {selectedReport.requirements.fireAlarm && <li>🔔 Hệ thống báo cháy tự động</li>}
                                    {selectedReport.requirements.escapeLadder && <li>🪜 Thang thoát hiểm</li>}
                                    {selectedReport.requirements.emergencyExit > 0 && <li>🚪 {selectedReport.requirements.emergencyExit} lối thoát hiểm</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
                        {/* Future: Add verify button */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
