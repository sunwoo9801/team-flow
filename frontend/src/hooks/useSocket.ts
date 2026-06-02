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
    | 'column:deleted';
  payload: unknown;
  userId: string;
}

export function useBoardSocket(boardId: string) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

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

    socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.emit('board:leave', { boardId });
      socket.disconnect();
    };
  }, [boardId, applyEvent]);

  return socketRef;
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
