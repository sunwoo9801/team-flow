import { useState, useRef, useCallback } from 'react';
import { useCardComments, useCreateComment, useDeleteComment } from '../../hooks/useComments';
import { formatRelativeTime } from '../../utils/activityFormatter';
import { renderMentionContent, serializeMention } from '../../utils/mention';
import { useAuthStore } from '../../store/auth.store';
import type { Comment } from '../../api/comment';

interface WorkspaceMember {
  userId: string;
  user: { id: string; name: string; email: string };
}

interface Props {
  cardId: string;
  members: WorkspaceMember[];
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const isPending = comment.id.startsWith('temp-');
  const initials = comment.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <li className={`flex gap-3 py-2.5 group ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center text-[10px] font-medium text-accent-700">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium text-zinc-800">{comment.user.name}</span>
          <time className="text-[11px] text-zinc-400">{formatRelativeTime(comment.createdAt)}</time>
        </div>
        <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap break-words mt-0.5">
          {renderMentionContent(comment.content)}
        </p>
      </div>
      {canDelete && !isPending && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs text-zinc-400
                     hover:text-red-500 transition-all duration-150 self-start mt-0.5"
        >
          삭제
        </button>
      )}
    </li>
  );
}

export function CommentSection({ cardId, members }: Props) {
  const { user } = useAuthStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useCardComments(cardId);
  const { mutate: createComment } = useCreateComment(cardId);
  const { mutate: deleteComment } = useDeleteComment(cardId);

  const [content, setContent] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const filteredMembers = members
    .filter(m => m.user.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 5);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursor = e.target.selectionStart;
    const uptoCursor = value.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const between = uptoCursor.slice(atIndex + 1);
      if (!/\s/.test(between) && between.length <= 20) {
        setMentionStart(atIndex);
        setMentionQuery(between);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const selectMention = (member: WorkspaceMember) => {
    const before = content.slice(0, mentionStart);
    const after = content.slice(mentionStart + 1 + mentionQuery.length);
    const token = serializeMention(member.user.name, member.userId) + ' ';
    const next = before + token + after;
    setContent(next);
    setShowMentionMenu(false);

    requestAnimationFrame(() => {
      const pos = (before + token).length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    createComment(trimmed);
    setContent('');
    setShowMentionMenu(false);
  };

  const allComments = data?.pages.flatMap(p => p.items) ?? [];

  return (
    <div>
      {/* 입력 */}
      <div className="relative mb-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !showMentionMenu) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === 'Escape') setShowMentionMenu(false);
          }}
          rows={2}
          placeholder="댓글을 입력하세요... (@로 멘션)"
          className="w-full text-[13px] text-zinc-700 placeholder:text-zinc-300 resize-none
                     bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2.5 leading-relaxed
                     hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent-100
                     focus:border-accent-400 transition-colors"
        />

        {showMentionMenu && filteredMembers.length > 0 && (
          <ul
            className="absolute z-10 left-2 bottom-full mb-1 w-56 bg-white border border-zinc-200
                         rounded-md shadow-lg py-1 max-h-48 overflow-y-auto"
          >
            {filteredMembers.map(m => (
              <li key={m.userId}>
                <button
                  onClick={() => selectMention(m)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-zinc-700
                             hover:bg-accent-50 transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center
                                  text-white text-[9px] font-bold uppercase shrink-0"
                  >
                    {m.user.name[0]}
                  </div>
                  <span className="truncate">{m.user.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-1.5">
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="h-7 px-3 bg-accent-500 hover:bg-accent-600 disabled:bg-zinc-200
                       disabled:text-zinc-400 text-white text-xs font-medium rounded-md
                       transition-colors duration-150"
          >
            등록
          </button>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : allComments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">아직 댓글이 없습니다.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {allComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                canDelete={comment.userId === user?.id}
                onDelete={() => deleteComment(comment.id)}
              />
            ))}
          </ul>
          <div ref={sentinelRef} className="py-2 text-center">
            {isFetchingNextPage && <span className="text-xs text-gray-400">불러오는 중...</span>}
          </div>
        </>
      )}
    </div>
  );
}
