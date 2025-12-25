export enum NotificationType {
  PAYMENT = 'PAYMENT',
  CONTRACT = 'CONTRACT',
  MAINTENANCE = 'MAINTENANCE',
  APPLICATION = 'APPLICATION',
  SYSTEM = 'SYSTEM',
}

export class Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: Date;
}
