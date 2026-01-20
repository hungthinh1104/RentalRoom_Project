import { auth } from "@/auth";
import { tenantDashboardApi } from "@/features/tenant/api/dashboard-api";
import { TenantDashboardView } from "./tenant-dashboard-view";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - Rental Room",
  description: "Tenant Dashboard",
};

export default async function TenantDashboardPage() {
  // 1. Fetch Session
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'TENANT') {
    redirect('/unauthorized');
  }

  const tenantId = session.user.id;
  const name = (session.user as any).fullName || session.user.name || "bạn";

  // 2. Parallel Data Fetching
  const [
    contracts,
    payments,
    recommendations,
    favorites,
    maintenance,
    bookings
  ] = await Promise.all([
    tenantDashboardApi.getActiveContracts(),
    tenantDashboardApi.getPendingPayments(),
    tenantDashboardApi.getRecommendations(),
    tenantDashboardApi.getFavorites(),
    tenantDashboardApi.getOpenMaintenance(tenantId),
    tenantDashboardApi.getActiveBookings(tenantId),
  ]);

  // 3. Prepare Data
  const dashboardData = {
    contracts: contracts,
    payments: payments,
    recommendations: recommendations,
    favorites: favorites,
    maintenance: maintenance,
    bookings: bookings,
  };

  // 4. Render View
  return (
    <TenantDashboardView
      user={{ name, id: tenantId }}
      data={dashboardData}
    />
  );
}
