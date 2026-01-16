"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PCCCReport {
    id: string;
    createdAt: string;
    complianceScore: number;
    status: string;
    property: {
        name: string;
        address: string;
        landlord: {
            user: {
                fullName: string;
                email: string;
            };
        };
    };
}

export default function AdminLegalDocumentsPage() {
    const [reports, setReports] = useState<PCCCReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data } = await api.get<PCCCReport[]>("/pccc/admin/reports");
                setReports(data);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
                toast.error("Không thể tải danh sách hồ sơ PCCC");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleDownload = async (reportId: string) => {
        try {
            // Using window.open for simplicity as the backend returns a stream with attachment header
            window.open(`${process.env.NEXT_PUBLIC_API_URL}/pccc/reports/${reportId}/pdf`, '_blank');
        } catch (error) {
            toast.error("Không thể tải xuống tài liệu");
        }
    };

    const getScoreBadge = (score: number) => {
        if (score >= 90) return <Badge className="bg-green-500/10 text-green-600 border-green-200">Đạt Chuẩn ({score}%)</Badge>;
        if (score >= 60) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Cần Cải Thiện ({score}%)</Badge>;
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Không Đạt ({score}%)</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Quản Lý Hồ Sơ Pháp Lý
                    </h1>
                    <p className="text-muted-foreground mt-1">Danh sách các hồ sơ PCCC đã được tạo trên hệ thống</p>
                </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>Mã Hồ Sơ</TableHead>
                            <TableHead>Bất Động Sản</TableHead>
                            <TableHead>Chủ Sở Hữu</TableHead>
                            <TableHead>Điểm Tuân Thủ</TableHead>
                            <TableHead>Ngày Tạo</TableHead>
                            <TableHead className="text-right">Tài Liệu</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Chưa có hồ sơ nào được tạo
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => (
                                <TableRow key={report.id} className="hover:bg-muted/5 transition-colors">
                                    <TableCell className="font-mono text-xs">
                                        {report.id.substring(0, 8).toUpperCase()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{report.property.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={report.property.address}>
                                                {report.property.address}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{report.property.landlord.user.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{report.property.landlord.user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getScoreBadge(report.complianceScore)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(report.createdAt), "dd/MM/yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => handleDownload(report.id)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Tải PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
