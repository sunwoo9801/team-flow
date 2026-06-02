import { useInfiniteQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity';

export function useCardActivities(cardId: string) {
  return useInfiniteQuery({
    queryKey: ['activities', cardId],
    queryFn: ({ pageParam }) => activityApi.getByCard(cardId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: !!cardId,
    staleTime: 30_000,
  });
}
