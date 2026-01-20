import { fetchAdminOverview, fetchAdminTopPerformers } from "@/features/admin/api-extended";
import AdminDashboardClient from "@/features/admin/components/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const [overview, top] = await Promise.all([
    fetchAdminOverview(),
    fetchAdminTopPerformers(),
  ]);

  const stats = {
    totalRevenue: overview.totalRevenue,
    occupancyRate: overview.occupancyRate,
    expiringContracts: overview.expiringContracts,
    activeUsers: overview.activeUsers,
    totalRooms: overview.totalRooms,
    totalProperties: 0,
    trends: overview.trends,
    topPerformers: top,
  };
  return <AdminDashboardClient stats={stats} />;
}
