import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import { CardDetailModal } from '../../components/card/CardDetailModal';
import type { Column, Card } from '../../hooks/useBoard';

const COLUMN_COLORS = [
  'bg-blue-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
  'bg-indigo-400',
];
const COLUMN_SOFT = [
  'bg-blue-50',
  'bg-violet-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-cyan-50',
  'bg-indigo-50',
];

/* ── 보드 통계 (서브헤더용) ── */
function BoardStats({ columns }: { columns: Column[] }) {
  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0);
  const overdueCards = columns
    .flatMap(c => c.cards)
    .filter(c => c.dueDate && new Date(c.dueDate) < new Date()).length;
  const assignedCards = columns.flatMap(c => c.cards).filter(c => c.assigneeId).length;

  const items = [
    { label: '전체 카드', value: totalCards, color: 'text-zinc-700' },
    { label: '담당자 배정', value: assignedCards, color: 'text-blue-600' },
    ...(overdueCards > 0
      ? [
          {
            label: '기한 초과',
            value: overdueCards,
            color: 'text-red-600',
          },
        ]
      : []),
    { label: '컬럼', value: columns.length, color: 'text-zinc-500' },
  ];

  return (
    <div className="flex items-center gap-5">
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
          <span className="text-xs text-zinc-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── SortableCard ── */
function SortableCard({
  card,
  columnId,
  onDelete,
  onClick,
}: {
  card: Card;
  columnId: string;
  onDelete: () => void;
  onClick: () => void;
}) {
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
      onClick={onClick}
      className={`
        group relative bg-white border rounded-xl p-3.5 select-none
        cursor-pointer
        transition-all duration-150
        ${
          isDragging
            ? 'opacity-40 shadow-2xl scale-105'
            : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
        }
      `}
    >
      {/* 삭제 버튼 */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        aria-label="카드 삭제"
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center
                   rounded-md opacity-0 group-hover:opacity-100
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

      <p className="text-sm font-medium text-zinc-800 leading-snug pr-5">{card.title}</p>

      {(card.assignee || card.dueDate) && (
        <div className="flex items-center justify-between mt-3 gap-2">
          {card.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium
                              px-2 py-0.5 rounded-full
                              ${overdue ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'}`}
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

/* ── SortableColumn ──
   컬럼 너비: 기본 280px / xl: 296px / 2xl: 312px / 3xl: 328px
*/
function SortableColumn({
  col,
  colorClass,
  softClass,
  onDeleteColumn,
  onDeleteCard,
  onCardClick,
  addingCard,
  newCardTitle,
  onNewCardTitleChange,
  onStartAddCard,
  onCancelAddCard,
  onAddCard,
}: {
  col: Column;
  colorClass: string;
  softClass: string;
  onDeleteColumn: () => void;
  onDeleteCard: (id: string) => void;
  onCardClick: (cardId: string) => void;
  addingCard: boolean;
  newCardTitle: string;
  onNewCardTitleChange: (v: string) => void;
  onStartAddCard: () => void;
  onCancelAddCard: () => void;
  onAddCard: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' },
  });

  const cardIds = useMemo(() => col.cards.map(c => c.id), [col.cards]);

  return (
    /* 너비: 반응형으로 점진적 확장 */
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`
        w-[280px] xl:w-[296px] 2xl:w-[312px] 3xl:w-[328px]
        shrink-0 flex flex-col
        transition-opacity duration-150
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {/* 컬럼 헤더 */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2.5 mb-2.5 px-1 cursor-grab active:cursor-grabbing"
      >
        <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
        <h2 className="flex-1 text-sm font-semibold text-zinc-700 select-none truncate">
          {col.title}
        </h2>
        {/* 카드 수 배지 */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                          ${softClass} ${colorClass
                            .replace('bg-', 'text-')
                            .replace('-400', '-700')} tabular-nums`}
        >
          {col.cards.length}
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDeleteColumn}
          aria-label="컬럼 삭제"
          className="w-5 h-5 flex items-center justify-center rounded
                     text-zinc-400 hover:text-red-500 hover:bg-red-50
                     transition-all duration-150 opacity-0
                     group-hover/col:opacity-100"
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

      {/* 카드 리스트 영역 */}
      <div
        className={`flex flex-col flex-1 ${softClass} rounded-2xl p-2.5 gap-2
                       overflow-y-auto min-h-[80px] border border-zinc-200/60 group/col`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {col.cards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={col.id}
              onDelete={() => onDeleteCard(card.id)}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </SortableContext>

        {/* 인라인 카드 추가 */}
        {addingCard && (
          <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-sm">
            <textarea
              autoFocus
              rows={2}
              value={newCardTitle}
              onChange={e => onNewCardTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddCard();
                }
                if (e.key === 'Escape') onCancelAddCard();
              }}
              placeholder="카드 이름 입력 후 Enter"
              className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 resize-none
                         border-none focus:outline-none bg-transparent leading-relaxed"
            />
            <div className="flex gap-2 mt-2.5">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={onAddCard}
                className="flex-1 h-7 bg-blue-600 hover:bg-blue-700 text-white text-xs
                           font-semibold rounded-lg transition-colors duration-150"
              >
                추가
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={onCancelAddCard}
                className="h-7 px-3 text-xs font-medium text-zinc-500
                           hover:text-zinc-800 hover:bg-zinc-200
                           rounded-lg transition-colors duration-150"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 카드 추가 버튼 */}
        {!addingCard && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onStartAddCard}
            className="flex items-center gap-1.5 px-2 py-2 text-xs font-medium
                       text-zinc-500 hover:text-zinc-800 hover:bg-white
                       rounded-xl transition-all duration-150 w-full"
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

/* ── Overlay ── */
function CardOverlay({ card }: { card: Card }) {
  return (
    <div className="w-[280px] bg-white border border-blue-300 rounded-xl p-3.5 shadow-2xl rotate-1">
      <p className="text-sm font-medium text-zinc-800">{card.title}</p>
    </div>
  );
}
function ColumnOverlay({ col, colorClass }: { col: Column; colorClass: string }) {
  return (
    <div className="w-[280px] bg-zinc-50/90 rounded-2xl p-3 shadow-2xl border border-blue-300">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
        <span className="text-sm font-semibold text-zinc-700">{col.title}</span>
      </div>
    </div>
  );
}

/* ── BoardPage ── */
export default function BoardPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const { data: board, isLoading } = useBoard(boardId!);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const selectedCardId = searchParams.get('card');
  const selectedCard = useMemo(
    () => board?.columns.flatMap(c => c.cards).find(c => c.id === selectedCardId) ?? null,
    [board, selectedCardId]
  );

  const handleCardClick = (cardId: string) => setSearchParams({ card: cardId });
  const handleModalClose = () => setSearchParams({});

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
  const activeColIdx = activeColumn
    ? (board?.columns.findIndex(c => c.id === activeColumn.id) ?? 0)
    : 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full gap-2 text-zinc-400 text-sm">
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
      {selectedCard && workspaceId && (
        <CardDetailModal
          card={selectedCard}
          boardId={boardId!}
          workspaceId={workspaceId}
          onClose={handleModalClose}
        />
      )}
      {/* ── 보드 서브헤더 ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* 통계 */}
          <BoardStats columns={board.columns} />

          {/* 우측 액션 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 컬럼 색상 도트 목록 (xl+) */}
            <div className="hidden xl:flex items-center gap-1.5">
              {board.columns.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-1" title={col.title}>
                  <div
                    className={`w-2 h-2 rounded-full
                                   ${COLUMN_COLORS[idx % COLUMN_COLORS.length]}`}
                  />
                  <span className="text-[11px] text-zinc-500 max-w-[80px] truncate">
                    {col.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 칸반 스크롤 영역 ── */}
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
                  softClass={COLUMN_SOFT[idx % COLUMN_SOFT.length]}
                  onDeleteColumn={() => deleteColumn(col.id)}
                  onDeleteCard={id => deleteCard(id)}
                  onCardClick={handleCardClick}
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
              <div className="w-[280px] xl:w-[296px] shrink-0">
                {addingColumn ? (
                  <div className="bg-zinc-100/80 rounded-2xl p-3 border border-zinc-200/60">
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
                                   hover:text-zinc-800 hover:bg-zinc-200
                                   rounded-xl transition-colors duration-150"
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
                               hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50
                               transition-all duration-150"
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
                colorClass={COLUMN_COLORS[activeColIdx % COLUMN_COLORS.length]}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
