import { useState, useCallback } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { useMoveCard, useMoveColumn } from './useKanban';
import type { BoardDetail, Column, Card } from './useBoard';

// position 재계산: 앞뒤 중간값 (lexicographic float 방식)
function calcPosition(items: { position: number }[], targetIndex: number): number {
  const prev = items[targetIndex - 1]?.position ?? 0;
  const next = items[targetIndex + 1]?.position;
  if (next === undefined) return prev + 1.0;
  return (prev + next) / 2;
}

export function useDnd(boardId: string) {
  const queryClient = useQueryClient();
  const { mutate: moveCard } = useMoveCard(boardId);
  const { mutate: moveColumn } = useMoveColumn(boardId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'card' | 'column' | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { id, data } = event.active;
    setActiveId(String(id));
    setActiveType((data.current as { type: 'card' | 'column' }).type);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeData = active.data.current as { type: string; columnId?: string };
      const overData = over.data.current as { type: string; columnId?: string } | undefined;

      // 카드를 다른 컬럼 위로 드래그
      if (activeData.type === 'card' && overData?.type === 'column') {
        queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
          if (!old) return old;
          let movedCard: Card | undefined;
          const cols = old.columns.map(col => {
            const filtered = col.cards.filter(c => {
              if (c.id === String(active.id)) {
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
              col.id === String(over.id)
                ? { ...col, cards: [...col.cards, { ...movedCard!, columnId: col.id }] }
                : col
            ),
          };
        });
      }
    },
    [boardId, queryClient]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveType(null);
      if (!over || active.id === over.id) return;

      const activeData = active.data.current as { type: string; columnId?: string };
      const overData = over.data.current as { type: string; columnId?: string } | undefined;

      const board = queryClient.getQueryData<BoardDetail>(['boards', boardId]);
      if (!board) return;

      // ── 컬럼 이동 ────────────────────────────────────────
      if (activeData.type === 'column' && overData?.type === 'column') {
        const oldIndex = board.columns.findIndex(c => c.id === String(active.id));
        const newIndex = board.columns.findIndex(c => c.id === String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(board.columns, oldIndex, newIndex);
        const position = calcPosition(reordered, newIndex);

        // 낙관적 업데이트
        queryClient.setQueryData<BoardDetail>(['boards', boardId], {
          ...board,
          columns: reordered.map((c, i) => (i === newIndex ? { ...c, position } : c)),
        });

        moveColumn({ columnId: String(active.id), position });
        return;
      }

      // ── 카드 이동 ────────────────────────────────────────
      if (activeData.type === 'card') {
        const sourceColId = activeData.columnId!;
        const destColId =
          overData?.type === 'column' ? String(over.id) : (overData?.columnId ?? sourceColId);

        const destCol = board.columns.find(c => c.id === destColId);
        if (!destCol) return;

        let newCards: Card[];
        if (sourceColId === destColId) {
          const oldIndex = destCol.cards.findIndex(c => c.id === String(active.id));
          const newIndex = destCol.cards.findIndex(c => c.id === String(over.id));
          if (oldIndex === -1) return;
          newCards = arrayMove(
            destCol.cards,
            oldIndex,
            newIndex < 0 ? destCol.cards.length - 1 : newIndex
          );
        } else {
          const overIndex = destCol.cards.findIndex(c => c.id === String(over.id));
          const filtered = destCol.cards.filter(c => c.id !== String(active.id));
          const sourceCard = board.columns
            .flatMap(c => c.cards)
            .find(c => c.id === String(active.id));
          if (!sourceCard) return;
          filtered.splice(overIndex < 0 ? filtered.length : overIndex, 0, {
            ...sourceCard,
            columnId: destColId,
          });
          newCards = filtered;
        }

        const targetIndex = newCards.findIndex(c => c.id === String(active.id));
        const position = calcPosition(newCards, targetIndex);

        // 낙관적 업데이트
        queryClient.setQueryData<BoardDetail>(['boards', boardId], old => {
          if (!old) return old;
          let movedCard: Card | undefined;
          const cols = old.columns.map(col => {
            const filtered = col.cards.filter(c => {
              if (c.id === String(active.id)) {
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
            columns: cols.map(col => {
              if (col.id !== destColId) return col;
              const inserted = newCards.map(c =>
                c.id === String(active.id) ? { ...movedCard!, columnId: destColId, position } : c
              );
              return { ...col, cards: inserted };
            }),
          };
        });

        moveCard({ cardId: String(active.id), columnId: destColId, position });
      }
    },
    [boardId, queryClient, moveCard, moveColumn]
  );

  return { activeId, activeType, handleDragStart, handleDragOver, handleDragEnd };
}
