import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationApi, type Notification } from '../api/notification';
import useSocket from './useSocket';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 60_000, // 1분마다 폴링 (Socket 보완)
    staleTime: 30_000,
  });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notificationApi.getAll(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Socket.IO 실시간 알림 수신
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      // 미읽음 카운트 즉시 증가
      queryClient.setQueryData(
        ['notifications', 'unread-count'],
        (old: { count: number } | undefined) => ({
          count: (old?.count ?? 0) + 1,
        })
      );

      // 알림 목록 맨 앞에 추가 (Optimistic)
      queryClient.setQueryData(
        ['notifications'],
        (old: { pages: { items: Notification[] }[] } | undefined) => {
          if (!old) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            items: [notification, ...(newPages[0]?.items ?? [])],
          };
          return { ...old, pages: newPages };
        }
      );
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient]);
}
