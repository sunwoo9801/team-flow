import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBoard } from '../../hooks/useBoard';
import {
  useCreateColumn,
  useDeleteColumn,
  useCreateCard,
  useDeleteCard,
} from '../../hooks/useKanban';
import { useBoardSocket } from '../../hooks/useSocket';
import { useDnd } from '../../hooks/useDnd';
import type { Column, Card } from '../../hooks/useBoard';

// ── SortableColumn ──────────────────────────────────────────

interface SortableColumnProps {
  col: Column;
  onDeleteColumn: () => void;
  onDeleteCard: (cardId: string) => void;
  addingCard: boolean;
  newCardTitle: string;
  onNewCardTitleChange: (v: string) => void;
  onStartAddCard: () => void;
  onCancelAddCard: () => void;
  onAddCard: () => void;
}

function SortableColumn(props: SortableColumnProps) {
  const { col } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cardIds = useMemo(() => col.cards.map(c => c.id), [col.cards]);

  return (
    <div ref={setNodeRef} style={style} className="w-72 shrink-0">
      <div className="bg-gray-100 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-200px)]">
        {/* 드래그 핸들 헤더 */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing shrink-0"
        >
          <span className="font-semibold text-sm text-gray-800 select-none">{col.title}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{col.cards.length}</span>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={props.onDeleteColumn}
              className="ml-1 text-gray-300 hover:text-red-400 transition-colors text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 카드 목록 */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {col.cards.map((card: Card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  columnId={col.id}
                  onDelete={() => props.onDeleteCard(card.id)}
                />
              ))}
            </div>
          </SortableContext>

          {props.addingCard && (
            <div className="bg-white rounded-lg border border-gray-200 p-2 space-y-2 mt-2">
              <textarea
                autoFocus
                rows={2}
                value={props.newCardTitle}
                onChange={e => props.onNewCardTitleChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    props.onAddCard();
                  }
                  if (e.key === 'Escape') props.onCancelAddCard();
                }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="카드 이름을 입력하세요"
              />
              <div className="flex gap-2">
                <button
                  onClick={props.onAddCard}
                  className="flex-1 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={props.onCancelAddCard}
                  className="flex-1 py-1 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {!props.addingCard && (
          <div className="px-3 pb-3 shrink-0">
            <button
              onClick={props.onStartAddCard}
              className="w-full py-1.5 text-sm text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-colors"
            >
              + 카드 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SortableCard ────────────────────────────────────────────

interface SortableCardProps {
  card: Card;
  columnId: string;
  onDelete: () => void;
}

function SortableCard({ card, columnId, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800 font-medium leading-snug select-none">{card.title}</p>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="text-gray-200 group-hover:text-gray-400 hover:text-red-400 transition-colors text-xs shrink-0"
        >
          ✕
        </button>
      </div>
      {card.assignee && (
        <p className="text-xs text-gray-400 mt-1.5 select-none">{card.assignee.name}</p>
      )}
      {card.dueDate && (
        <p className="text-xs text-blue-400 mt-0.5 select-none">
          {new Date(card.dueDate).toLocaleDateString('ko-KR')}
        </p>
      )}
    </div>
  );
}

// ── DragOverlay 미리보기 ────────────────────────────────────

function CardOverlay({ card }: { card: Card }) {
  return (
    <div className="w-72 bg-white rounded-lg border border-blue-300 p-3 shadow-lg rotate-2">
      <p className="text-sm text-gray-800 font-medium">{card.title}</p>
    </div>
  );
}

function ColumnOverlay({ col }: { col: Column }) {
  return (
    <div className="w-72 bg-gray-100 rounded-xl border border-blue-300 p-3 shadow-lg opacity-90">
      <p className="font-semibold text-sm text-gray-800">{col.title}</p>
    </div>
  );
}

// ── BoardPage ───────────────────────────────────────────────

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading } = useBoard(boardId!);

  useBoardSocket(boardId!);

  const { mutate: createColumn } = useCreateColumn(boardId!);
  const { mutate: deleteColumn } = useDeleteColumn(boardId!);
  const { mutate: createCard } = useCreateCard(boardId!);
  const { mutate: deleteCard } = useDeleteCard(boardId!);

  const { activeId, activeType, handleDragStart, handleDragOver, handleDragEnd } = useDnd(boardId!);

  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columnIds = useMemo(() => board?.columns.map(c => c.id) ?? [], [board?.columns]);

  const activeCard = useMemo(() => {
    if (!board || activeType !== 'card') return null;
    return board.columns.flatMap(c => c.cards).find(c => c.id === activeId) ?? null;
  }, [board, activeId, activeType]);

  const activeColumn = useMemo(() => {
    if (!board || activeType !== 'column') return null;
    return board.columns.find(c => c.id === activeId) ?? null;
  }, [board, activeId, activeType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        보드 불러오는 중...
      </div>
    );
  }
  if (!board) return null;

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    createColumn(newColumnTitle.trim(), {
      onSuccess: () => {
        setNewColumnTitle('');
        setAddingColumn(false);
      },
    });
  };

  const handleAddCard = (columnId: string) => {
    if (!newCardTitle.trim()) return;
    createCard(
      { columnId, title: newCardTitle.trim() },
      {
        onSuccess: () => {
          setNewCardTitle('');
          setAddingCardColId(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6">
      <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">{board.title}</h1>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 p-6 h-full items-start" style={{ minWidth: 'max-content' }}>
              {board.columns.map((col: Column) => (
                <SortableColumn
                  key={col.id}
                  col={col}
                  onDeleteColumn={() => deleteColumn(col.id)}
                  onDeleteCard={cardId => deleteCard(cardId)}
                  addingCard={addingCardColId === col.id}
                  newCardTitle={newCardTitle}
                  onNewCardTitleChange={setNewCardTitle}
                  onStartAddCard={() => setAddingCardColId(col.id)}
                  onCancelAddCard={() => {
                    setAddingCardColId(null);
                    setNewCardTitle('');
                  }}
                  onAddCard={() => handleAddCard(col.id)}
                />
              ))}

              <div className="w-72 shrink-0">
                {addingColumn ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                    <input
                      autoFocus
                      value={newColumnTitle}
                      onChange={e => setNewColumnTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddColumn();
                        if (e.key === 'Escape') setAddingColumn(false);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="컬럼 이름"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                      >
                        추가
                      </button>
                      <button
                        onClick={() => setAddingColumn(false)}
                        className="flex-1 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    + 컬럼 추가
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && <CardOverlay card={activeCard} />}
            {activeColumn && <ColumnOverlay col={activeColumn} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
