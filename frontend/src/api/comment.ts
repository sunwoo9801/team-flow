import { api } from './axios';

export interface CommentUser {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
}

export interface CommentPage {
  items: Comment[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const commentApi = {
  getByCard: (cardId: string, cursor?: string, limit = 20): Promise<CommentPage> =>
    api.get(`/cards/${cardId}/comments`, { params: { cursor, limit } }).then(r => r.data),

  create: (cardId: string, content: string): Promise<Comment> =>
    api.post(`/cards/${cardId}/comments`, { content }).then(r => r.data),

  remove: (commentId: string): Promise<void> =>
    api.delete(`/comments/${commentId}`).then(r => r.data),
};
