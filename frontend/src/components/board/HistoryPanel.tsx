import { useState, useRef, useEffect } from 'react';
import {
  useBoardSnapshots,
  useCreateSnapshot,
  useRestoreSnapshot,
  useDeleteSnapshot,
} from '../../hooks/useSnapshots';
import { formatRelativeTime } from '../../utils/activityFormatter';

export function HistoryPanel({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: snapshots, isLoading } = useBoardSnapshots(boardId);
  const { mutate: createSnapshot, isPending: isCreating } = useCreateSnapshot(boardId);
  const { mutate: restoreSnapshot, isPending: isRestoring } = useRestoreSnapshot(boardId);
  const { mutate: deleteSnapshot } = useDeleteSnapshot(boardId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreate = () => {
    createSnapshot(label.trim() || undefined, { onSuccess: () => setLabel('') });
  };

  const handleRestore = (snapshotId: string) => {
    const ok = window.confirm(
      '이 시점으로 복원하면 이후에 추가/변경된 컬럼·카드·댓글·첨부파일은 모두 사라집니다. 계속할까요?'
    );
    if (ok) restoreSnapshot(snapshotId);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-zinc-600
                   bg-white border border-zinc-200 rounded-md hover:border-zinc-300
                   transition-colors duration-150"
      >
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        히스토리
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-zinc-200 z-50 overflow-hidden">
          {/* 스냅샷 생성 */}
          <div className="p-3 border-b border-zinc-100 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
              현재 상태 저장
            </p>
            <div className="flex gap-1.5">
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="메모 (선택)"
                className="flex-1 h-7 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-400"
              />
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="h-7 px-3 text-xs font-medium text-white bg-accent-500 hover:bg-accent-600
                           disabled:bg-zinc-300 rounded-md transition-colors"
              >
                스냅샷
              </button>
            </div>
          </div>

          {/* 목록 */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
            {isLoading ? (
              <p className="text-sm text-zinc-400 text-center py-8">불러오는 중...</p>
            ) : !snapshots || snapshots.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">저장된 스냅샷이 없습니다.</p>
            ) : (
              snapshots.map(s => (
                <div key={s.id} className="px-3 py-2.5 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-800 truncate">{s.label || '스냅샷'}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {s.user.name} · {formatRelativeTime(s.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRestore(s.id)}
                        disabled={isRestoring}
                        className="h-6 px-2 text-[11px] font-medium text-accent-600 hover:bg-accent-50
                                   rounded-md transition-colors disabled:opacity-50"
                      >
                        복원
                      </button>
                      <button
                        onClick={() => deleteSnapshot(s.id)}
                        className="h-6 px-2 text-[11px] font-medium text-zinc-400 hover:text-red-500
                                   hover:bg-red-50 rounded-md transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
