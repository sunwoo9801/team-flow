import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelApi } from '../api/label';

export function useBoardLabels(boardId: string) {
  return useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => labelApi.getByBoard(boardId),
    enabled: !!boardId,
    staleTime: 30_000,
  });
}

export function useCreateLabel(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      labelApi.create(boardId, name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels', boardId] }),
  });
}

export function useUpdateLabel(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ labelId, ...payload }: { labelId: string; name?: string; color?: string }) =>
      labelApi.update(labelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    },
  });
}

export function useDeleteLabel(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelApi.remove(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    },
  });
}

export function useAttachLabel(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      labelApi.attachToCard(cardId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}

export function useDetachLabel(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      labelApi.detachFromCard(cardId, labelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', boardId] }),
  });
}
