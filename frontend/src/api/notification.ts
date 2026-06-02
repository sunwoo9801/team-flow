import { api } from './axios';

export interface NotificationActor {
  id: string;
  name: string;
  email: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'MENTION' | 'CARD_ASSIGNED' | 'COMMENT_ADDED' | 'CARD_DUE_SOON';
  message: string;
  link: string | null;
  isRead: boolean;
  cardId: string | null;
  createdAt: string;
  actor: NotificationActor;
}

export interface NotificationPage {
  items: Notification[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const notificationApi = {
  getAll: (cursor?: string, limit = 20): Promise<NotificationPage> =>
    api.get('/notifications', { params: { cursor, limit } }).then(r => r.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get('/notifications/unread-count').then(r => r.data),

  markAsRead: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}/read`).then(r => r.data),

  markAllAsRead: (): Promise<void> => api.patch('/notifications/read-all').then(r => r.data),
};
