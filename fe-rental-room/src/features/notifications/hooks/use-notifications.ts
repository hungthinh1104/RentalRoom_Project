import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notificationsApi';
import { useSession } from '@/features/auth/hooks/use-auth';

export function useNotifications() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () =>
      notificationsApi.getAll({
        userId,
        isRead: false,
        limit: 100,
      }),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
