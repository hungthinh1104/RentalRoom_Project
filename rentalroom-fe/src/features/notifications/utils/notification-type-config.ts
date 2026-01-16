import React from 'react';
import {
  Bell,
  FileText,
  Wrench,
  AlertCircle,
  Info,
} from 'lucide-react';
import { NotificationType } from '../entities';

/**
 * Notification Type Configuration
 * Maps NotificationType enum to icon, color, and display info
 * 
 * Used in UI components to show consistent notification presentation
 */
export interface NotificationTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string; // bg-* class
  textColor: string; // text-* class
  borderColor: string; // border-* class
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  [NotificationType.PAYMENT]: {
    label: 'Thanh toán',
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  [NotificationType.CONTRACT]: {
    label: 'Hợp đồng',
    icon: FileText,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  [NotificationType.MAINTENANCE]: {
    label: 'Bảo trì',
    icon: Wrench,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  [NotificationType.APPLICATION]: {
    label: 'Đơn đăng ký',
    icon: FileText,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  [NotificationType.SYSTEM]: {
    label: 'Hệ thống',
    icon: Info,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

/**
 * Get notification type config by type
 */
export function getNotificationTypeConfig(
  type: NotificationType | string,
): NotificationTypeConfig {
  const config = NOTIFICATION_TYPE_CONFIG[type as NotificationType];
  return (
    config || {
      label: 'Thông báo',
      icon: Bell,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
    }
  );
}

/**
 * Get icon for notification type
 */
export function getNotificationIcon(
  type: NotificationType | string,
): React.ComponentType<{ className?: string }> {
  return getNotificationTypeConfig(type).icon;
}

/**
 * Get label for notification type
 */
export function getNotificationLabel(type: NotificationType | string): string {
  return getNotificationTypeConfig(type).label;
}

/**
 * Get all available notification types for filtering
 */
export function getAvailableNotificationTypes(): Array<{
  value: string;
  label: string;
}> {
  return Object.values(NotificationType).map((type) => ({
    value: type,
    label: getNotificationLabel(type),
  }));
}
