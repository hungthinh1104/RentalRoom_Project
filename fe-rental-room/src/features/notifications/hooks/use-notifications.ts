import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notificationsApi';
import { useSession } from '@/features/auth/hooks/use-auth';

export function useNotifications(enabled = true, pollIntervalMs = 60000) {
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
    enabled: !!userId && enabled,
    // Poll only when enabled, visible, and at the configured interval
    refetchInterval: () => {
      if (!enabled || !userId) return false;
      if (typeof document === 'undefined') return false;
      // Don't poll when tab isn't visible
      if (document.visibilityState !== 'visible') return false;
      return pollIntervalMs;
    },

    // Prevent polling when tab is backgrounded (safety)
    refetchIntervalInBackground: false,
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
