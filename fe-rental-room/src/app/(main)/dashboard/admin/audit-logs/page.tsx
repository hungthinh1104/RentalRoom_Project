"use client";

import { useState } from "react";
import { useAuditLogs } from "@/features/admin/hooks/use-audit-logs";
import { AuditLogTable } from "@/features/admin/components/audit/audit-log-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [actionType, setActionType] = useState<string>("ALL");
    const [entityType, setEntityType] = useState<string>("ALL");
    const limit = 20;

    const { data, isLoading, refetch } = useAuditLogs({
        page,
        limit,
        actionType: actionType === "ALL" ? undefined : actionType,
        entityType: entityType === "ALL" ? undefined : entityType,
    });

    const handleNextPage = () => {
        if (data?.meta && page < data.meta.lastPage) {
            setPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(p => p - 1);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">
                        Track system integrity, user actions, and security events.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>Activity Log</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={actionType} onValueChange={setActionType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Action Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="INVOICE_ISSUED">Invoice Issued</SelectItem>
                                    <SelectItem value="INVOICE_PAID">Invoice Paid</SelectItem>
                                    <SelectItem value="EXPENSE_RECORDED">Expense Recorded</SelectItem>
                                    <SelectItem value="EXPENSE_VOIDED">Expense Voided</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={entityType} onValueChange={setEntityType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Entity Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Entities</SelectItem>
                                    <SelectItem value="INVOICE">Invoice</SelectItem>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="CONTRACT">Contract</SelectItem>
                                    <SelectItem value="PAYMENT">Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <AuditLogTable
                        data={data?.data || []}
                        isLoading={isLoading}
                    />

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Page {page} of {data?.meta?.lastPage || 1} ({data?.meta?.total || 0} records)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={page <= 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={!data?.meta || page >= data.meta.lastPage || isLoading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
