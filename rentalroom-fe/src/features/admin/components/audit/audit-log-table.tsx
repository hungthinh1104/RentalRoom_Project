"use client";

import { useState } from "react";
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
import { Eye, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { Snapshot } from "@/lib/api/snapshotsApi";
import { AuditDetailModal } from "./audit-detail-modal";
import { cn } from "@/lib/utils";

interface AuditLogTableProps {
    data: Snapshot[];
    isLoading: boolean;
}

export function AuditLogTable({ data, isLoading }: AuditLogTableProps) {
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

    const getActionColor = (action: string) => {
        if (action.includes("CREATE") || action.includes("ISSUED") || action.includes("RECORDED")) return "default"; // green-ish usually
        if (action.includes("UPDATE") || action.includes("PAID")) return "secondary"; // blue-ish
        if (action.includes("DELETE") || action.includes("VOIDED") || action.includes("CANCEL")) return "destructive"; // red
        return "outline";
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Không có dữ liệu nhật ký.</div>;
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Thời gian</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Đối tượng</TableHead>
                            <TableHead>Module</TableHead>
                            <TableHead>Người thực hiện</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getActionColor(log.actionType)} className="whitespace-nowrap">
                                        {log.actionType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={log.entityId}>
                                    <code className="text-xs bg-muted p-1 rounded font-mono">{log.entityId.slice(0, 8)}...</code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.entityType}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{log.actorRole}</span>
                                        <span className="text-xs text-muted-foreground truncate w-[150px]">{log.actorId}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedSnapshot(log)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Chi tiết
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AuditDetailModal
                snapshot={selectedSnapshot}
                isOpen={!!selectedSnapshot}
                onClose={() => setSelectedSnapshot(null)}
            />
        </>
    );
}
