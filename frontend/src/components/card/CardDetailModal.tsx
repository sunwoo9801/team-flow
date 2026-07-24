import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useUpdateCard } from '../../hooks/useKanban';
import { CardActivityFeed } from '../activity/CardActivityFeed';
import { CommentSection } from './CommentSection';
import { AttachmentSection } from './AttachmentSection';
import { LabelPicker } from './LabelPicker';
import type { Card } from '../../hooks/useBoard';

interface Props {
  card: Card;
  boardId: string;
  workspaceId: string;
  onClose: () => void;
}

export function CardDetailModal({ card, boardId, workspaceId, onClose }: Props) {
  const { data: workspace } = useWorkspace(workspaceId);
  const { mutate: updateCard } = useUpdateCard(boardId);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setTitle(card.title); }, [card.title]);
  useEffect(() => { setDescription(card.description ?? ''); }, [card.description]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleConfirm(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  const saveTitle = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === card.title) return;
    updateCard({ cardId: card.id, title: trimmed });
  };

  const saveDescription = () => {
    const trimmed = description.trim();
    if (trimmed === (card.description ?? '')) return;
    updateCard({ cardId: card.id, description: trimmed || null as unknown as string });
  };

  // 확인: 미저장 제목/설명 반영 후 닫기
  const handleConfirm = () => {
    saveTitle();
    saveDescription();
    onClose();
  };

  const members = workspace?.members ?? [];
  const overdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12 px-4 pb-4"
      onClick={handleConfirm}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더: 제목 */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-zinc-100">
          <div className="flex-1">
            <textarea
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); titleRef.current?.blur(); }
              }}
              rows={1}
              className="w-full text-lg font-semibold text-zinc-900 resize-none bg-transparent
                         border border-transparent rounded-lg px-2 py-1 leading-snug
                         hover:border-zinc-200 focus:outline-none focus:border-blue-400
                         focus:ring-2 focus:ring-blue-100 transition-colors"
            />
          </div>
          <button
            onClick={handleConfirm}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                       text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 바디 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 설명 + 활동 */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {/* 설명 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                설명
              </h3>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={saveDescription}
                rows={5}
                placeholder="카드에 대한 설명을 입력하세요..."
                className="w-full text-sm text-zinc-700 placeholder:text-zinc-300 resize-none
                           bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 leading-relaxed
                           hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-100
                           focus:border-blue-400 transition-colors"
              />
            </section>

            {/* 댓글 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                댓글
              </h3>
              <CommentSection cardId={card.id} members={members} />
            </section>

            {/* 첨부파일 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                첨부파일
              </h3>
              <AttachmentSection cardId={card.id} />
            </section>

            {/* 활동 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                활동
              </h3>
              <CardActivityFeed cardId={card.id} />
            </section>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="w-52 shrink-0 border-l border-zinc-100 px-4 py-5 flex flex-col gap-6 overflow-y-auto bg-zinc-50/50">
            {/* 라벨 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                라벨
              </h3>
              <LabelPicker boardId={boardId} cardId={card.id} cardLabels={card.labels} />
            </section>

            {/* 담당자 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                담당자
              </h3>
              {/* 현재 담당자 표시 */}
              {card.assignee && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center
                                  text-white text-[10px] font-bold uppercase">
                    {card.assignee.name[0]}
                  </div>
                  <span className="text-sm text-zinc-700 truncate">{card.assignee.name}</span>
                </div>
              )}
              <select
                value={card.assigneeId ?? ''}
                onChange={e => updateCard({ cardId: card.id, assigneeId: e.target.value || null })}
                className="w-full text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl
                           px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100
                           focus:border-blue-400 transition-colors cursor-pointer"
              >
                <option value="">담당자 없음</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </section>

            {/* 마감일 */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                마감일
              </h3>
              <input
                type="date"
                value={card.dueDate ? card.dueDate.slice(0, 10) : ''}
                onChange={e => updateCard({ cardId: card.id, dueDate: e.target.value || null })}
                className={`w-full text-sm bg-white border rounded-xl px-3 py-2 cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
                            transition-colors
                            ${overdue ? 'border-red-300 text-red-600' : 'border-zinc-200 text-zinc-700'}`}
              />
              {card.dueDate && (
                <button
                  onClick={() => updateCard({ cardId: card.id, dueDate: null })}
                  className="mt-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  마감일 삭제
                </button>
              )}
            </section>

          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-3 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={handleConfirm}
            className="h-8 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                       rounded-lg transition-colors duration-150"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
