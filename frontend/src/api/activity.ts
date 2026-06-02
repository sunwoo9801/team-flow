import { api } from './axios';

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
}

export interface CardActivity {
  id: string;
  cardId: string;
  userId: string;
  actionType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: ActivityUser;
}

export interface ActivityPage {
  items: CardActivity[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const activityApi = {
  getByCard: (cardId: string, cursor?: string, limit = 20): Promise<ActivityPage> =>
    api
      .get(`/cards/${cardId}/activities`, {
        params: { cursor, limit },
      })
      .then(r => r.data),
};
