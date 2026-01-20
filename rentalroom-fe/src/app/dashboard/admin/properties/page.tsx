import { Suspense } from "react";
import { fetchAdminProperties } from "@/features/admin/api-extended";
import { AdminPropertiesClient } from "@/features/admin/components/admin-properties-client";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const data = await fetchAdminProperties(1, 50);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminPropertiesClient initialData={data} />
    </Suspense>
  );
}

