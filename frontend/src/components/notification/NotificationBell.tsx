import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useRealtimeNotifications,
} from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/activityFormatter';
import type { Notification } from '../../api/notification';

const TYPE_LABEL: Record<Notification['type'], string> = {
  MENTION: '멘션',
  CARD_ASSIGNED: '담당자 지정',
  COMMENT_ADDED: '새 댓글',
  CARD_DUE_SOON: '마감 임박',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: unreadData } = useUnreadCount();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  useRealtimeNotifications();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = data?.pages.flatMap(p => p.items) ?? [];

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClickNotification = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* 벨 버튼 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 패널 */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 목록 */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
            ) : isError ? (
              <p className="text-sm text-red-400 text-center py-8">알림을 불러오지 못했습니다.</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">알림이 없습니다.</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.isRead ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* 아바타 */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                      {n.actor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-indigo-500 font-medium">
                          {TYPE_LABEL[n.type]}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!n.isRead && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 더 불러오기 */}
          {hasNextPage && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
