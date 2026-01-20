import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { tenantDashboardApi } from '../api/dashboard-api';
import { queryKeys } from '@/lib/api/query-keys';

export function useTenantDashboard() {
  const { data: session } = useSession();
  const tenantId = session?.user?.id;

  const contractsQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.contracts(),
    queryFn: tenantDashboardApi.getActiveContracts,
  });

  const paymentsQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.payments(),
    queryFn: tenantDashboardApi.getPendingPayments,
  });

  const recommendationsQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.recommendations(),
    queryFn: tenantDashboardApi.getRecommendations,
  });

  const favoritesQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.favorites(),
    queryFn: tenantDashboardApi.getFavorites,
  });

  const maintenanceQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.maintenance(tenantId!),
    queryFn: () => tenantDashboardApi.getOpenMaintenance(tenantId!),
    enabled: !!tenantId,
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.tenant.dashboard.bookings(tenantId!),
    queryFn: () => tenantDashboardApi.getActiveBookings(tenantId!),
    enabled: !!tenantId,
  });

  return {
    contractsQuery,
    paymentsQuery,
    recommendationsQuery,
    favoritesQuery,
    maintenanceQuery,
    bookingsQuery,
  };
}
