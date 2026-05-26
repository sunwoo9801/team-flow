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

/* ── 컬럼 색상 도트 ── */
const COLUMN_COLORS = [
  'bg-blue-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
  'bg-indigo-400',
];

/* ── SortableCard ── */
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

  const overdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`
        group relative bg-white border rounded-xl p-3.5
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-150
        ${
          isDragging
            ? 'opacity-40 shadow-2xl scale-105'
            : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
        }
      `}
      aria-label={`카드: ${card.title}`}
    >
      {/* 삭제 버튼 */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onDelete}
        aria-label="카드 삭제"
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100
                   w-5 h-5 flex items-center justify-center rounded-md
                   text-zinc-400 hover:text-red-500 hover:bg-red-50
                   transition-all duration-150"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 카드 제목 */}
      <p className="text-sm font-medium text-zinc-800 leading-snug pr-5">{card.title}</p>

      {/* 메타 정보 */}
      {(card.assignee || card.dueDate) && (
        <div className="flex items-center justify-between mt-3 gap-2">
          {card.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5
                              rounded-full ${
                                overdue ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'
                              }`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {new Date(card.dueDate).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {card.assignee && (
            <div
              className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center
                            justify-center text-white text-[9px] font-bold uppercase shrink-0"
              title={card.assignee.name}
            >
              {card.assignee.name[0]}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ── SortableColumn ── */
interface SortableColumnProps {
  col: Column;
  colorClass: string;
  onDeleteColumn: () => void;
  onDeleteCard: (id: string) => void;
  addingCard: boolean;
  newCardTitle: string;
  onNewCardTitleChange: (v: string) => void;
  onStartAddCard: () => void;
  onCancelAddCard: () => void;
  onAddCard: () => void;
}
function SortableColumn(props: SortableColumnProps) {
  const { col, colorClass } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' },
  });

  const cardIds = useMemo(() => col.cards.map(c => c.id), [col.cards]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-72 shrink-0 flex flex-col transition-opacity duration-150
                  ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* 컬럼 헤더 */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2.5 mb-2.5 px-1
                   cursor-grab active:cursor-grabbing"
      >
        <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
        <h2 className="flex-1 text-sm font-semibold text-zinc-700 select-none truncate">
          {col.title}
        </h2>
        <span className="text-xs font-semibold text-zinc-400 tabular-nums">{col.cards.length}</span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={props.onDeleteColumn}
          aria-label="컬럼 삭제"
          className="opacity-0 group-hover/col:opacity-100 w-5 h-5 flex items-center
                     justify-center rounded text-zinc-400 hover:text-red-500
                     hover:bg-red-50 transition-all duration-150"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 카드 리스트 */}
      <div
        className="flex flex-col flex-1 bg-zinc-100/80 rounded-2xl p-2.5 gap-2
                      overflow-y-auto min-h-[80px] group/col"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {col.cards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={col.id}
              onDelete={() => props.onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>

        {/* 인라인 카드 추가 */}
        {props.addingCard ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-sm">
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
              placeholder="카드 이름 입력 후 Enter"
              className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 resize-none
                         border-none focus:outline-none bg-transparent leading-relaxed"
            />
            <div className="flex gap-2 mt-2.5">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={props.onAddCard}
                className="flex-1 h-7 bg-blue-600 hover:bg-blue-700 text-white text-xs
                           font-semibold rounded-lg transition-colors duration-150"
              >
                추가
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={props.onCancelAddCard}
                className="h-7 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800
                           hover:bg-zinc-200 rounded-lg transition-colors duration-150"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          /* 카드 추가 버튼 */
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={props.onStartAddCard}
            className="flex items-center gap-1.5 px-2 py-2 text-xs font-medium
                       text-zinc-500 hover:text-zinc-800 hover:bg-white
                       rounded-xl transition-all duration-150 w-full"
            aria-label="카드 추가"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            카드 추가
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Overlay 컴포넌트 ── */
function CardOverlay({ card }: { card: Card }) {
  return (
    <div className="w-72 bg-white border border-blue-300 rounded-xl p-3.5 shadow-2xl rotate-1">
      <p className="text-sm font-medium text-zinc-800">{card.title}</p>
    </div>
  );
}
function ColumnOverlay({ col, colorClass }: { col: Column; colorClass: string }) {
  return (
    <div className="w-72 bg-zinc-100/90 rounded-2xl p-3 shadow-2xl border border-blue-300">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
        <span className="text-sm font-semibold text-zinc-700">{col.title}</span>
      </div>
    </div>
  );
}

/* ── BoardPage (메인) ── */
export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading } = useBoard(boardId!);

  useBoardSocket(boardId!);

  const { mutate: createColumn } = useCreateColumn(boardId!);
  const { mutate: deleteColumn } = useDeleteColumn(boardId!);
  const { mutate: createCard } = useCreateCard(boardId!);
  const { mutate: deleteCard } = useDeleteCard(boardId!);

  const { activeId, activeType, handleDragStart, handleDragOver, handleDragEnd } = useDnd(boardId!);

  const [newColTitle, setNewColTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columnIds = useMemo(() => board?.columns.map(c => c.id) ?? [], [board?.columns]);
  const activeCard = useMemo(
    () =>
      activeType === 'card'
        ? (board?.columns.flatMap(c => c.cards).find(c => c.id === activeId) ?? null)
        : null,
    [board, activeId, activeType]
  );
  const activeColumn = useMemo(
    () => (activeType === 'column' ? (board?.columns.find(c => c.id === activeId) ?? null) : null),
    [board, activeId, activeType]
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm gap-2">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        보드 불러오는 중...
      </div>
    );
  if (!board) return null;

  const handleAddColumn = () => {
    if (!newColTitle.trim()) return;
    createColumn(newColTitle.trim(), {
      onSuccess: () => {
        setNewColTitle('');
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
    <div className="flex flex-col h-full">
      {/* 보드 서브 헤더 (컬럼 수, 카드 총수) */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0
                     002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0
                     002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          컬럼 {board.columns.length}개 · 카드{' '}
          {board.columns.reduce((s, c) => s + c.cards.length, 0)}개
        </div>
      </div>

      {/* 칸반 스크롤 영역 */}
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
              {board.columns.map((col: Column, idx) => (
                <SortableColumn
                  key={col.id}
                  col={col}
                  colorClass={COLUMN_COLORS[idx % COLUMN_COLORS.length]}
                  onDeleteColumn={() => deleteColumn(col.id)}
                  onDeleteCard={id => deleteCard(id)}
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

              {/* 컬럼 추가 */}
              <div className="w-72 shrink-0">
                {addingColumn ? (
                  <div className="bg-zinc-100/80 rounded-2xl p-3">
                    <input
                      autoFocus
                      value={newColTitle}
                      onChange={e => setNewColTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddColumn();
                        if (e.key === 'Escape') setAddingColumn(false);
                      }}
                      placeholder="컬럼 이름 입력 후 Enter"
                      className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-xl
                                 text-sm text-zinc-900 placeholder:text-zinc-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:border-transparent mb-2.5"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white
                                   text-xs font-semibold rounded-xl transition-colors duration-150"
                      >
                        추가
                      </button>
                      <button
                        onClick={() => setAddingColumn(false)}
                        className="h-8 px-3 text-xs font-medium text-zinc-500
                                   hover:text-zinc-800 hover:bg-zinc-200 rounded-xl
                                   transition-colors duration-150"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full h-10 flex items-center justify-center gap-2
                               rounded-2xl border-2 border-dashed border-zinc-300
                               text-sm font-medium text-zinc-400
                               hover:border-blue-400 hover:text-blue-500
                               hover:bg-blue-50/50 transition-all duration-150"
                    aria-label="컬럼 추가"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    컬럼 추가
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
            {activeCard && <CardOverlay card={activeCard} />}
            {activeColumn && (
              <ColumnOverlay
                col={activeColumn}
                colorClass={
                  COLUMN_COLORS[
                    board.columns.findIndex(c => c.id === activeColumn.id) % COLUMN_COLORS.length
                  ]
                }
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
