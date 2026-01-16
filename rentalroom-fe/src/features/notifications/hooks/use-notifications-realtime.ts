'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from '@/features/auth/hooks/use-auth';
import {
  initializeNotificationSocket,
  subscribeToNotifications,
  disconnectNotificationSocket,
  isNotificationSocketConnected,
  waitForSocketReady,
} from '@/lib/socket-io';
import { notificationsApi, type NotificationResponse } from '@/lib/api/notificationsApi';

/**
 * Real-time notifications hook
 * 
 * Combines WebSocket real-time delivery with fallback to polling
 * - On first load: Fetch from DB
 * - On WebSocket message: Add to list immediately
 * - Fallback: Poll every 30s if WebSocket disconnects
 * 
 * Usage:
 * ```typescript
 * const { notifications, unreadCount, isLoading, refetch } = useNotificationsRealtime()
 * ```
 */
export function useNotificationsRealtime() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await notificationsApi.getAll({
        userId,
        limit: 50,
      });

      setNotifications(response.data);
      setUnreadCount(response.data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle WebSocket notification
  const handleWebSocketNotification = useCallback((notification: NotificationResponse) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isComponentMounted = true;

    // Always fetch once (even without websocket token)
    fetchNotifications();

    // Only attempt WebSocket when accessToken is present; otherwise poll
    if (!session?.tokens?.accessToken) {
      pollIntervalRef.current = setInterval(fetchNotifications, 60000);
      return () => {
        isComponentMounted = false;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }

    const setupWebSocket = async () => {
      try {
        const socket = initializeNotificationSocket(session.tokens.accessToken);

        if (isComponentMounted) {
          setIsSocketConnected(socket.connected);
        }

        await waitForSocketReady(5000);

        if (isComponentMounted) {
          unsubscribeRef.current = subscribeToNotifications(handleWebSocketNotification);
          setIsSocketConnected(true);
        }

        if (isComponentMounted) {
          pollIntervalRef.current = setInterval(async () => {
            if (!isNotificationSocketConnected()) {
              await fetchNotifications();
            }
          }, 60000);
        }
      } catch (error) {
        console.error('WebSocket setup failed:', error);
        if (isComponentMounted) {
          setIsSocketConnected(false);
          pollIntervalRef.current = setInterval(fetchNotifications, 60000);
        }
      }
    };

    setupWebSocket();

    return () => {
      isComponentMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId, session?.tokens?.accessToken, fetchNotifications, handleWebSocketNotification]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationsApi.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    []
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await notificationsApi.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === id);
        const filtered = prev.filter((n) => n.id !== id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Refetch notifications
  const refetch = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isSocketConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  };
}
