"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { notificationsApi, type NotificationResponse } from '@/lib/api/notificationsApi';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/features/auth/hooks/use-auth';

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count: externalCount }: NotificationBellProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [open, setOpen] = useState(false);
  // Reduce polling further by increasing interval to 2 minutes (120s)
  const { notifications, unreadCount, isLoading, refetch } = useNotifications(open, 120000);
  const { toast } = useToast();
  const [marking, setMarking] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string) => {
    try {
      setMarking(id);
      await notificationsApi.markAsRead(id);
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu là đã đọc.',
      });
      refetch();
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu thông báo.',
        variant: 'destructive',
      });
    } finally {
      setMarking(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    try {
      await notificationsApi.markAllAsRead(userId);
      toast({
        title: 'Thành công',
        description: 'Tất cả thông báo đã được đánh dấu là đã đọc.',
      });
      refetch();
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu tất cả thông báo.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      toast({
        title: 'Thành công',
        description: 'Thông báo đã bị xóa.',
      });
      refetch();
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thông báo.',
        variant: 'destructive',
      });
    }
  };

  // Lightweight count query: fetch unread count once (no polling) to show badge without continuous polling
  const countQuery = useQuery({
    queryKey: ['notifications-count', userId],
    queryFn: () => notificationsApi.getAll({ userId, isRead: false, limit: 1 }),
    enabled: !!userId,
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // keep cached for 30 minutes,
  });

  const lightweightCount = countQuery.data?.total || 0;
  const displayCount = externalCount ?? (open ? unreadCount : lightweightCount);

  // Throttle refetches on open to avoid rapid repeated calls (10s)
  const lastRefetchRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (open) {
      const now = Date.now();
      if (now - lastRefetchRef.current > 10000) {
        refetch();
        // also refresh lightweight count
        countQuery.refetch();
        lastRefetchRef.current = now;
      }
    }
  }, [open, refetch, countQuery]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayCount > 99 ? '99+' : displayCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-sm">Thông báo</h3>
          {displayCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-auto py-1 px-2 gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Đánh dấu tất cả
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: NotificationResponse) => (
                <div
                  key={notification.id}
                  className="px-3 py-3 border-b hover:bg-accent transition-colors flex gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.sentAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={marking === notification.id}
                    >
                      {marking === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <Button
                variant="outline"
                className="w-full text-xs h-8"
                asChild
              >
                <a href="/dashboard/notifications">Xem tất cả thông báo</a>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;

