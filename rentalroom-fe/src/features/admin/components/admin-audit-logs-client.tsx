"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuditLogTable } from "./audit/audit-log-table";
import type { PaginatedAuditLogs } from "@/features/admin/api-extended";

interface AdminAuditLogsClientProps {
  initialData: PaginatedAuditLogs;
}

export function AdminAuditLogsClient({ initialData }: AdminAuditLogsClientProps) {
  const [actionType, setActionType] = useState<string>("ALL");
  const [entityType, setEntityType] = useState<string>("ALL");

  const data = initialData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track system integrity, user actions, and security events.
          </p>
        </div>
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
            data={data.data}
            isLoading={false}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {data.meta.page} of {data.meta.lastPage} ({data.meta.total} records)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.page >= data.meta.lastPage}
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
