import { fetchAdminOverview, fetchAdminTopPerformers } from "@/features/admin/api-extended";
import AdminDashboardClient from "@/features/admin/components/admin-dashboard-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  // Ensure only admins can access (defensive in addition to layout guard)
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  let overview: Awaited<ReturnType<typeof fetchAdminOverview>> | null = null;
  let top: Awaited<ReturnType<typeof fetchAdminTopPerformers>> | null = null;

  try {
    [overview, top] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminTopPerformers(),
    ]);
  } catch (err) {
    // Gracefully degrade to safe defaults to avoid Server Components error boundary
    // Optionally, log server-side for debugging
    console.error("[AdminDashboard] Failed to fetch overview/top performers:", err);
  }

  const stats = {
    totalRevenue: overview?.totalRevenue ?? 0,
    occupancyRate: overview?.occupancyRate ?? 0,
    expiringContracts: overview?.expiringContracts ?? 0,
    activeUsers: overview?.activeUsers ?? 0,
    totalRooms: overview?.totalRooms ?? 0,
    totalProperties: 0,
    trends: overview?.trends ?? [],
    topPerformers: top ?? { landlords: [], properties: [] },
  };
  return <AdminDashboardClient stats={stats} />;
}
