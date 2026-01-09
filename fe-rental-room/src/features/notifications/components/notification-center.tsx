'use client';

import React from 'react';
import { Bell, CheckCheck, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationTypeConfig,
  getNotificationIcon,
} from '@/features/notifications/utils/notification-type-config';
import { useRouter } from 'next/navigation';
import { useNotificationsRealtime } from '@/features/notifications/hooks/use-notifications-realtime';
import type { NotificationResponse } from '@/lib/api/notificationsApi';

interface NotificationCenterProps {
  externalCount?: number;
}

export function NotificationCenter({ externalCount }: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false);
  const [marking, setMarking] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isLoading,
    isSocketConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsRealtime();

  const handleNotificationClick = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      markAsRead(notification.id).catch(console.error);
    }

    setOpen(false);

    switch (notification.notificationType) {
      case 'BILLING':
      case 'INCOME':
        router.push('/dashboard/landlord/income');
        break;
      case 'CONTRACT':
        router.push('/dashboard/landlord/contracts');
        break;
      case 'MAINTENANCE':
        router.push('/dashboard/landlord/maintenance');
        break;
      case 'JV_REQUEST':
        router.push('/dashboard/landlord/properties');
        break;
      default:
        break;
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setMarking(id);
      await markAsRead(id);
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu là đã đọc.',
      });
    } catch (error) {
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
    try {
      await markAllAsRead();
      toast({
        title: 'Thành công',
        description: 'Tất cả thông báo đã được đánh dấu là đã đọc.',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu tất cả thông báo.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeleting(id);
      await deleteNotification(id);
      toast({
        title: 'Thành công',
        description: 'Thông báo đã bị xóa.',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thông báo.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const displayCount = externalCount ?? unreadCount;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          title={isSocketConnected ? 'Real-time connected' : 'Polling mode'}
        >
          <Bell className="h-5 w-5" />

          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayCount > 99 ? '99+' : displayCount}
            </Badge>
          )}

          <div
            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            title={isSocketConnected ? 'Connected' : 'Polling'}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Thông báo</h3>
            {!isSocketConnected && (
              <AlertCircle className="h-3 w-3 text-yellow-500" title="Using polling" />
            )}
          </div>

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

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Không có thông báo</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: NotificationResponse) => {
                const typeConfig = getNotificationTypeConfig(
                  notification.notificationType
                );
                const IconComponent = getNotificationIcon(
                  notification.notificationType
                );

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-3 py-3 border-b border-border transition-colors flex gap-3 group hover:${typeConfig.bgColor} cursor-pointer`}
                    title="Nhấn để xem chi tiết"
                  >
                    <div
                      className={`flex-shrink-0 mt-1 p-2 rounded-lg ${typeConfig.bgColor}`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${typeConfig.textColor}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold line-clamp-1 text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.content}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.sentAt).toLocaleDateString(
                          'vi-VN'
                        )}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          disabled={marking === notification.id}
                          title="Mark as read"
                        >
                          {marking === notification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        disabled={deleting === notification.id}
                        title="Delete"
                      >
                        {deleting === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationCenter;
