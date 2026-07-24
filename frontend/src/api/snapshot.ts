import { api } from './axios';

export interface BoardSnapshot {
  id: string;
  label: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

export const snapshotApi = {
  getByBoard: (boardId: string): Promise<BoardSnapshot[]> =>
    api.get(`/boards/${boardId}/snapshots`).then(r => r.data),

  create: (boardId: string, label?: string): Promise<BoardSnapshot> =>
    api.post(`/boards/${boardId}/snapshots`, { label }).then(r => r.data),

  restore: (snapshotId: string): Promise<{ restored: boolean }> =>
    api.post(`/snapshots/${snapshotId}/restore`).then(r => r.data),

  remove: (snapshotId: string): Promise<void> =>
    api.delete(`/snapshots/${snapshotId}`).then(r => r.data),
};
