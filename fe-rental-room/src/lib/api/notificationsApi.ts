import api from './client';

export interface GetNotificationsParams {
  userId?: string;
  isRead?: boolean;
  notificationType?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  notificationType: string;
  relatedEntityId?: string;
  isRead: boolean;
  sentAt: string;
}

export interface PaginatedNotificationResponse {
  data: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  // Get all notifications with filters
  async getAll(
    params?: GetNotificationsParams,
  ): Promise<PaginatedNotificationResponse> {
    const queryParams = new URLSearchParams();

    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.isRead !== undefined)
      queryParams.append('isRead', String(params.isRead));
    if (params?.notificationType)
      queryParams.append('notificationType', params.notificationType);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    const url = query ? `/notifications?${query}` : '/notifications';

    const { data } = await api.get<PaginatedNotificationResponse>(url);
    return data;
  },

  // Get single notification
  async getOne(id: string): Promise<NotificationResponse> {
    const { data } = await api.get<NotificationResponse>(`/notifications/${id}`);
    return data;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<NotificationResponse> {
    const { data } = await api.patch<NotificationResponse>(`/notifications/${id}/mark-as-read`, {});
    return data;
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { data } = await api.patch(`/notifications/user/${userId}/mark-all-as-read`, {});
    return data;
  },

  // Delete notification
  async delete(id: string): Promise<void> {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },

  // Delete all notifications for user
  async deleteAll(userId: string): Promise<void> {
    const { data } = await api.delete(`/notifications/user/${userId}`);
    return data;
  },
};
