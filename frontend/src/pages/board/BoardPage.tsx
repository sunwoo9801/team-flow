import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoard } from '../../hooks/useBoard';
import {
  useCreateColumn,
  useDeleteColumn,
  useCreateCard,
  useDeleteCard,
} from '../../hooks/useKanban';
import type { Column, Card } from '../../hooks/useBoard';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading } = useBoard(boardId!);
  const { mutate: createColumn } = useCreateColumn(boardId!);
  const { mutate: deleteColumn } = useDeleteColumn(boardId!);
  const { mutate: createCard } = useCreateCard(boardId!);
  const { mutate: deleteCard } = useDeleteCard(boardId!);

  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

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
      {/* 보드 헤더 */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">{board.title}</h1>
      </div>

      {/* 칸반 스크롤 영역 */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full items-start" style={{ minWidth: 'max-content' }}>
          {board.columns.map((col: Column) => (
            <ColumnCard
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

          {/* 컬럼 추가 */}
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
      </div>
    </div>
  );
}

interface ColumnCardProps {
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

function ColumnCard({
  col,
  onDeleteColumn,
  onDeleteCard,
  addingCard,
  newCardTitle,
  onNewCardTitleChange,
  onStartAddCard,
  onCancelAddCard,
  onAddCard,
}: ColumnCardProps) {
  return (
    <div className="w-72 shrink-0 bg-gray-100 rounded-xl border border-gray-200 flex flex-col max-h-full">
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <span className="font-semibold text-sm text-gray-800">{col.title}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">{col.cards.length}</span>
          <button
            onClick={onDeleteColumn}
            className="ml-1 text-gray-300 hover:text-red-400 transition-colors text-xs px-1"
            title="컬럼 삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2">
        {col.cards.map((card: Card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-xs group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-800 font-medium leading-snug">{card.title}</p>
              <button
                onClick={() => onDeleteCard(card.id)}
                className="text-gray-200 group-hover:text-gray-400 hover:text-red-400 transition-colors text-xs shrink-0"
              >
                ✕
              </button>
            </div>
            {card.assignee && <p className="text-xs text-gray-400 mt-1.5">{card.assignee.name}</p>}
            {card.dueDate && (
              <p className="text-xs text-blue-400 mt-0.5">
                {new Date(card.dueDate).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        ))}

        {/* 카드 추가 인라인 */}
        {addingCard && (
          <div className="bg-white rounded-lg border border-gray-200 p-2 space-y-2">
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
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="카드 이름을 입력하세요"
            />
            <div className="flex gap-2">
              <button
                onClick={onAddCard}
                className="flex-1 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={onCancelAddCard}
                className="flex-1 py-1 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 카드 추가 버튼 */}
      {!addingCard && (
        <div className="px-3 pb-3 shrink-0">
          <button
            onClick={onStartAddCard}
            className="w-full py-1.5 text-sm text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-colors"
          >
            + 카드 추가
          </button>
        </div>
      )}
    </div>
  );
}
