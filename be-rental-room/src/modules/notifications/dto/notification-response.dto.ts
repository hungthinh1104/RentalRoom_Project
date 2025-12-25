import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class NotificationResponseDto {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  notificationType: string;

  @Expose()
  isRead: boolean;

  @Expose()
  sentAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  readAt?: Date;
}
