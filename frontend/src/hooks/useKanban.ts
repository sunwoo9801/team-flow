import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { Column, Card, BoardDetail } from './useBoard';

// ── 컬럼 훅 ────────────────────────────────────────────────

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post<Column>(`/boards/${boardId}/columns`, { title });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const { data } = await api.patch<Column>(`/columns/${columnId}`, { title });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useMoveColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ columnId, position }: { columnId: string; position: number }) => {
      const { data } = await api.patch<Column>(`/columns/${columnId}/move`, { position });
      return data;
    },
    onMutate: async ({ columnId, position }) => {
      await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
      const prev = queryClient.getQueryData<BoardDetail>(['boards', boardId]);
      queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns
            .map(c => (c.id === columnId ? { ...c, position } : c))
            .sort((a, b) => a.position - b.position),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['boards', boardId], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (columnId: string) => {
      await api.delete(`/columns/${columnId}`);
      return columnId;
    },
    onMutate: async columnId => {
      await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
      const prev = queryClient.getQueryData<BoardDetail>(['boards', boardId]);
      queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
        if (!old) return old;
        return { ...old, columns: old.columns.filter(c => c.id !== columnId) };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['boards', boardId], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

// ── 카드 훅 ────────────────────────────────────────────────

export function useCreateCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const { data } = await api.post<Card>(`/columns/${columnId}/cards`, { title });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useUpdateCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      ...payload
    }: {
      cardId: string;
      title?: string;
      description?: string;
      priority?: Card['priority'];
      dueDate?: string | null;
    }) => {
      const { data } = await api.patch<Card>(`/cards/${cardId}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useAttachAssignee(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, userId }: { cardId: string; userId: string }) => {
      const { data } = await api.post<Card>(`/cards/${cardId}/assignees/${userId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useDetachAssignee(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, userId }: { cardId: string; userId: string }) => {
      const { data } = await api.delete<Card>(`/cards/${cardId}/assignees/${userId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      columnId,
      position,
    }: {
      cardId: string;
      columnId: string;
      position: number;
    }) => {
      const { data } = await api.patch<Card>(`/cards/${cardId}/move`, { columnId, position });
      return data;
    },
    onMutate: async ({ cardId, columnId, position }) => {
      await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
      const prev = queryClient.getQueryData<BoardDetail>(['boards', boardId]);
      queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
        if (!old) return old;
        let movedCard: Card | undefined;
        const columns = old.columns.map(col => {
          const filtered = col.cards.filter(c => {
            if (c.id === cardId) {
              movedCard = c;
              return false;
            }
            return true;
          });
          return { ...col, cards: filtered };
        });
        if (movedCard) {
          return {
            ...old,
            columns: columns.map(col => {
              if (col.id !== columnId) return col;
              const updated = { ...movedCard!, columnId, position };
              return {
                ...col,
                cards: [...col.cards, updated].sort((a, b) => a.position - b.position),
              };
            }),
          };
        }
        return old;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['boards', boardId], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
      return cardId;
    },
    onMutate: async cardId => {
      await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
      const prev = queryClient.getQueryData<BoardDetail>(['boards', boardId]);
      queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => ({
            ...col,
            cards: col.cards.filter(c => c.id !== cardId),
          })),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['boards', boardId], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}
