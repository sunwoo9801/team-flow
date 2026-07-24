import { api } from './axios';
import type { Card } from '../hooks/useBoard';

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export const labelApi = {
  getByBoard: (boardId: string): Promise<Label[]> =>
    api.get(`/boards/${boardId}/labels`).then(r => r.data),

  create: (boardId: string, name: string, color: string): Promise<Label> =>
    api.post(`/boards/${boardId}/labels`, { name, color }).then(r => r.data),

  update: (labelId: string, payload: { name?: string; color?: string }): Promise<Label> =>
    api.patch(`/labels/${labelId}`, payload).then(r => r.data),

  remove: (labelId: string): Promise<void> => api.delete(`/labels/${labelId}`).then(r => r.data),

  attachToCard: (cardId: string, labelId: string): Promise<Card> =>
    api.post(`/cards/${cardId}/labels/${labelId}`).then(r => r.data),

  detachFromCard: (cardId: string, labelId: string): Promise<Card> =>
    api.delete(`/cards/${cardId}/labels/${labelId}`).then(r => r.data),
};
