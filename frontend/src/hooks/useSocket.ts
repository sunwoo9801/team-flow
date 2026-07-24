import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { BoardDetail, Card } from './useBoard';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:4000';

interface BoardEvent {
  type:
    | 'card:moved'
    | 'card:created'
    | 'card:updated'
    | 'card:deleted'
    | 'column:moved'
    | 'column:created'
    | 'column:updated'
    | 'column:deleted'
    | 'comment:created'
    | 'comment:deleted'
    | 'attachment:created'
    | 'attachment:deleted'
    | 'label:created'
    | 'label:updated'
    | 'label:deleted'
    | 'board:restored';
  payload: unknown;
  userId: string;
}

export interface RemoteCursor {
  userId: string;
  name: string;
  x: number;
  y: number;
  updatedAt: number;
}

const CURSOR_TTL_MS = 4000;
const CURSOR_THROTTLE_MS = 50;

export function useBoardSocket(boardId: string) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const lastCursorSentRef = useRef(0);

  const applyEvent = useCallback(
    (event: BoardEvent) => {
      queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
        if (!old) return old;

        switch (event.type) {
          case 'card:created': {
            const card = event.payload as Card;
            return {
              ...old,
              columns: old.columns.map(col =>
                col.id === card.columnId
                  ? {
                      ...col,
                      cards: [...col.cards.filter(c => c.id !== card.id), card].sort(
                        (a, b) => a.position - b.position
                      ),
                    }
                  : col
              ),
            };
          }

          case 'card:updated': {
            const updated = event.payload as Card;
            return {
              ...old,
              columns: old.columns.map(col => ({
                ...col,
                cards: col.cards.map(c => (c.id === updated.id ? updated : c)),
              })),
            };
          }

          case 'card:moved': {
            const moved = event.payload as Card;
            let movedCard: Card | undefined;
            const cols = old.columns.map(col => {
              const filtered = col.cards.filter(c => {
                if (c.id === moved.id) {
                  movedCard = c;
                  return false;
                }
                return true;
              });
              return { ...col, cards: filtered };
            });
            if (!movedCard) return old;
            return {
              ...old,
              columns: cols.map(col =>
                col.id === moved.columnId
                  ? {
                      ...col,
                      cards: [...col.cards, { ...movedCard!, ...moved }].sort(
                        (a, b) => a.position - b.position
                      ),
                    }
                  : col
              ),
            };
          }

          case 'card:deleted': {
            const { cardId, columnId } = event.payload as { cardId: string; columnId: string };
            return {
              ...old,
              columns: old.columns.map(col =>
                col.id === columnId
                  ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
                  : col
              ),
            };
          }

          case 'comment:created':
          case 'comment:deleted': {
            const { cardId } = event.payload as { cardId: string };
            queryClient.invalidateQueries({ queryKey: ['comments', cardId] });
            queryClient.invalidateQueries({ queryKey: ['activities', cardId] });
            return old;
          }

          case 'attachment:created':
          case 'attachment:deleted': {
            const { cardId } = event.payload as { cardId: string };
            queryClient.invalidateQueries({ queryKey: ['attachments', cardId] });
            queryClient.invalidateQueries({ queryKey: ['activities', cardId] });
            return old;
          }

          case 'label:created':
          case 'label:updated':
          case 'label:deleted':
            queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            return old;

          case 'board:restored':
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            queryClient.invalidateQueries({ queryKey: ['labels', boardId] });
            queryClient.invalidateQueries({ queryKey: ['snapshots', boardId] });
            return old;

          default:
            // 컬럼 이벤트는 전체 refetch
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            return old;
        }
      });
    },
    [boardId, queryClient]
  );

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token || !boardId) return;

    const socket = io(`${SOCKET_URL}/boards`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('board:join', { boardId });
    });

    socket.on('board:update', (event: BoardEvent) => {
      applyEvent(event);
    });

    socket.on('cursor:move', (data: Omit<RemoteCursor, 'updatedAt'>) => {
      setCursors(prev => ({ ...prev, [data.userId]: { ...data, updatedAt: Date.now() } }));
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.emit('board:leave', { boardId });
      socket.disconnect();
    };
  }, [boardId, applyEvent]);

  // 오래된(연결 끊긴) 커서 정리
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now();
        const next: Record<string, RemoteCursor> = {};
        for (const [userId, cursor] of Object.entries(prev)) {
          if (now - cursor.updatedAt < CURSOR_TTL_MS) next[userId] = cursor;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendCursor = useCallback(
    (x: number, y: number, name: string) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current < CURSOR_THROTTLE_MS) return;
      lastCursorSentRef.current = now;
      socketRef.current?.emit('cursor:move', { boardId, x, y, name });
    },
    [boardId]
  );

  return { socketRef, cursors, sendCursor };
}

export default function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    const s = io(`${SOCKET_URL}/boards`, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return socket;
}
