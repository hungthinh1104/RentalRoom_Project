import { useQuery } from '@tanstack/react-query';
import { tenantDashboardApi } from '../api/dashboard-api';

export function useTenantDashboard() {
  const contractsQuery = useQuery({
    queryKey: ['tenant-dashboard', 'contracts'],
    queryFn: tenantDashboardApi.getActiveContracts,
  });

  const paymentsQuery = useQuery({
    queryKey: ['tenant-dashboard', 'payments'],
    queryFn: tenantDashboardApi.getPendingPayments,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['tenant-dashboard', 'recommendations'],
    queryFn: tenantDashboardApi.getRecommendations,
  });

  // Favorites endpoint not available; keep empty to avoid breaking
  const favoritesQuery = useQuery({
    queryKey: ['tenant-dashboard', 'favorites'],
    queryFn: tenantDashboardApi.getFavorites,
  });

  return {
    contractsQuery,
    paymentsQuery,
    recommendationsQuery,
    favoritesQuery,
  };
}
