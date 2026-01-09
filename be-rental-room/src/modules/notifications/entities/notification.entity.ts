export enum NotificationType {
  PAYMENT = 'PAYMENT',
  CONTRACT = 'CONTRACT',
  MAINTENANCE = 'MAINTENANCE',
  APPLICATION = 'APPLICATION',
  SYSTEM = 'SYSTEM',
  COMPLAINT_CREATED = 'COMPLAINT_CREATED',
  COMPLAINT_RESPONDED = 'COMPLAINT_RESPONDED',
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
