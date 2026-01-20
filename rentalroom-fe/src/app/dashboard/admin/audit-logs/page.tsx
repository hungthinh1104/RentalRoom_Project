import { Suspense } from "react";
import { fetchAuditLogs } from "@/features/admin/api-extended";
import { AdminAuditLogsClient } from "@/features/admin/components/admin-audit-logs-client";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const data = await fetchAuditLogs(1, 20);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminAuditLogsClient initialData={data} />
    </Suspense>
  );
}

