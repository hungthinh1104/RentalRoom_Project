import { auth } from "@/auth";
import { Suspense } from "react";
import { AdminProfileClient } from "@/features/admin/components/admin-profile-client";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdminProfileClient user={session.user} />
    </Suspense>
  );
}

