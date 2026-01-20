import { Suspense } from "react";
import { fetchPCCCReports } from "@/features/admin/api-extended";
import { AdminLegalDocumentsClient } from "@/features/admin/components/admin-legal-documents-client";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

export const dynamic = 'force-dynamic';

export default async function AdminLegalDocumentsPage() {
  const reports = await fetchPCCCReports();

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminLegalDocumentsClient reports={reports} />
    </Suspense>
  );
}

