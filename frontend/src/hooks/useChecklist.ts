import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { Card } from './useBoard';

export function useCreateChecklistItem(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, text }: { cardId: string; text: string }) => {
      const { data } = await api.post<Card>(`/cards/${cardId}/checklist-items`, { text });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useToggleChecklistItem(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, done }: { itemId: string; done: boolean }) => {
      const { data } = await api.patch<Card>(`/checklist-items/${itemId}`, { done });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useUpdateChecklistItemText(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const { data } = await api.patch<Card>(`/checklist-items/${itemId}`, { text });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useMoveChecklistItem(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, position }: { itemId: string; position: number }) => {
      const { data } = await api.patch<Card>(`/checklist-items/${itemId}/move`, { position });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useDeleteChecklistItem(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete<Card>(`/checklist-items/${itemId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}
