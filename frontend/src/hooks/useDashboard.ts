import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export function useBoardDashboard(boardId: string) {
  return useQuery({
    queryKey: ['dashboard', boardId],
    queryFn: () => dashboardApi.getByBoard(boardId),
    enabled: !!boardId,
    staleTime: 30_000,
  });
}
