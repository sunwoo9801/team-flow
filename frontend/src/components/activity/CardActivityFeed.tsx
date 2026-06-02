import { useRef, useCallback } from 'react';
import { useCardActivities } from '../../hooks/useActivity';
import { formatActivityMessage, formatRelativeTime } from '../../utils/activityFormatter';
import type { CardActivity } from '../../api/activity';

interface Props {
  cardId: string;
}

function ActivityItem({ activity }: { activity: CardActivity }) {
  const message = formatActivityMessage(activity.actionType, activity.metadata, activity.user.name);
  const timeAgo = formatRelativeTime(activity.createdAt);
  const initials = activity.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <li className="flex gap-3 py-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{message}</p>
        <time className="text-xs text-gray-400 mt-0.5 block">{timeAgo}</time>
      </div>
    </li>
  );
}

export function CardActivityFeed({ cardId }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useCardActivities(cardId);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const allActivities = data?.pages.flatMap(p => p.items) ?? [];

  if (allActivities.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">아직 활동 기록이 없습니다.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-gray-100">
        {allActivities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </ul>

      <div ref={sentinelRef} className="py-2 text-center">
        {isFetchingNextPage && <span className="text-xs text-gray-400">불러오는 중...</span>}
        {!hasNextPage && allActivities.length > 0 && (
          <span className="text-xs text-gray-300">모든 기록을 불러왔습니다.</span>
        )}
      </div>
    </div>
  );
}
