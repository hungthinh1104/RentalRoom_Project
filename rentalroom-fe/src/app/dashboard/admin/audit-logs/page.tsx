import { Suspense } from "react";
import { fetchAuditLogs } from "@/features/admin/api-extended";
import { AdminAuditLogsClient } from "@/features/admin/components/admin-audit-logs-client";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  try {
    const data = await fetchAuditLogs(1, 20);

    return (
      <Suspense fallback={<TableSkeleton />}>
        <AdminAuditLogsClient initialData={data} />
      </Suspense>
    );
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Error Loading Logs</h2>
          <p className="font-mono text-sm break-all">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }
}

