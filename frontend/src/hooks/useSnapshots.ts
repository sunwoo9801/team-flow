import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snapshotApi } from '../api/snapshot';

export function useBoardSnapshots(boardId: string) {
  return useQuery({
    queryKey: ['snapshots', boardId],
    queryFn: () => snapshotApi.getByBoard(boardId),
    enabled: !!boardId,
    staleTime: 10_000,
  });
}

export function useCreateSnapshot(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label?: string) => snapshotApi.create(boardId, label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] }),
  });
}

export function useRestoreSnapshot(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (snapshotId: string) => snapshotApi.restore(snapshotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
    },
  });
}

export function useDeleteSnapshot(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (snapshotId: string) => snapshotApi.remove(snapshotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] }),
  });
}
