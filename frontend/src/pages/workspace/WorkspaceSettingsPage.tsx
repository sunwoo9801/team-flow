import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';
import {
  useRenameWorkspace,
  useDeleteWorkspace,
  useRemoveMember,
  useChangeRole,
  useTransferOwnership,
  useLeaveWorkspace,
} from '../../hooks/useWorkspace';
import { useMyRole } from '../../hooks/useMyRole';
import { useAuthStore } from '../../store/auth.store';

function avatarColor(name: string) {
  const COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: ws, isLoading } = useWorkspace(workspaceId!);
  const { isOwner, isAdmin } = useMyRole(workspaceId!);

  const { mutate: rename, isPending: renaming } = useRenameWorkspace(workspaceId!);
  const { mutate: deleteWorkspace, isPending: deleting } = useDeleteWorkspace();
  const { mutate: removeMember } = useRemoveMember(workspaceId!);
  const { mutate: changeRole } = useChangeRole(workspaceId!);
  const { mutate: transferOwnership, isPending: transferring } = useTransferOwnership(workspaceId!);
  const { mutate: leaveWorkspace, isPending: leaving } = useLeaveWorkspace();

  const [name, setName] = useState('');
  const [transferTarget, setTransferTarget] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs local draft when the workspace name changes
    if (ws) setName(ws.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.name]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">불러오는 중...</div>
    );
  }
  if (!ws) return null;

  const handleRename = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === ws.name) return;
    rename(trimmed);
  };

  const handleDelete = () => {
    if (!window.confirm(`정말 "${ws.name}" 워크스페이스를 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    deleteWorkspace(workspaceId!);
  };

  const handleRemoveMember = (userId: string, name: string) => {
    if (!window.confirm(`${name}님을 워크스페이스에서 제거하시겠습니까?`)) return;
    removeMember(userId);
  };

  const handleLeave = () => {
    if (!user) return;
    if (!window.confirm('워크스페이스에서 나가시겠습니까?')) return;
    leaveWorkspace({ workspaceId: workspaceId!, userId: user.id });
  };

  const handleTransfer = () => {
    if (!transferTarget) return;
    if (!window.confirm('소유권을 이전하면 되돌릴 수 없습니다. 계속하시겠습니까?')) return;
    transferOwnership(transferTarget, { onSuccess: () => setTransferTarget('') });
  };

  const otherMembers = ws.members.filter(m => m.userId !== user?.id);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <nav className="bg-white border-b border-zinc-200 px-6 py-3.5 shrink-0">
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500
                     hover:text-zinc-900 transition-colors duration-150 group"
        >
          <svg className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
               fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          워크스페이스로 돌아가기
        </button>
      </nav>

      <div className="flex-1 overflow-auto px-6 lg:px-10 py-8 max-w-2xl w-full mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">워크스페이스 설정</h1>
          <p className="mt-1 text-sm text-zinc-500">{ws.name}</p>
        </div>

        {/* 이름 변경 */}
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">워크스페이스 이름</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!isAdmin}
              className="flex-1 h-9 px-3 bg-white border border-zinc-300 rounded-md text-sm
                         text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-100
                         focus:border-accent-400 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400"
            />
            {isAdmin && (
              <button
                onClick={handleRename}
                disabled={renaming || !name.trim() || name.trim() === ws.name}
                className="h-9 px-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50
                           text-white text-sm font-semibold rounded-md transition-colors duration-150"
              >
                저장
              </button>
            )}
          </div>
          {!isAdmin && (
            <p className="mt-2 text-xs text-zinc-400">관리자만 이름을 변경할 수 있습니다.</p>
          )}
        </section>

        {/* 멤버 관리 */}
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">멤버 ({ws.members.length})</h2>
          <div className="space-y-1">
            {ws.members.map(m => {
              const isSelf = m.userId === user?.id;
              const isTargetOwner = m.userId === ws.ownerId;
              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors duration-150"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${avatarColor(m.user.name)} flex items-center
                                justify-center text-white text-xs font-bold uppercase shrink-0`}
                  >
                    {m.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {m.user.name} {isSelf && <span className="text-zinc-400 font-normal">(나)</span>}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{m.user.email}</p>
                  </div>

                  {isTargetOwner ? (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-accent-100 text-accent-700 shrink-0">
                      소유자
                    </span>
                  ) : isAdmin ? (
                    <select
                      value={m.role}
                      onChange={e => changeRole({ userId: m.userId, role: e.target.value as 'admin' | 'member' })}
                      className="text-xs bg-white border border-zinc-200 rounded-md px-2 py-1
                                 focus:outline-none focus:ring-2 focus:ring-accent-100 shrink-0 cursor-pointer"
                    >
                      <option value="member">멤버</option>
                      <option value="admin">관리자</option>
                    </select>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
                      {m.role === 'admin' ? '관리자' : '멤버'}
                    </span>
                  )}

                  {isSelf && !isTargetOwner && (
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="text-xs font-medium text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                    >
                      나가기
                    </button>
                  )}
                  {!isSelf && !isTargetOwner && isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.user.name)}
                      className="text-xs font-medium text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                    >
                      제거
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 소유권 이전 */}
        {isOwner && otherMembers.length > 0 && (
          <section className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-800 mb-1">소유권 이전</h2>
            <p className="text-xs text-zinc-400 mb-3">
              소유권을 이전하면 되돌릴 수 없습니다. 신중하게 선택해 주세요.
            </p>
            <div className="flex gap-2">
              <select
                value={transferTarget}
                onChange={e => setTransferTarget(e.target.value)}
                className="flex-1 h-9 px-3 text-sm bg-white border border-zinc-300 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-accent-100 cursor-pointer"
              >
                <option value="">멤버 선택</option>
                {otherMembers.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
              <button
                onClick={handleTransfer}
                disabled={!transferTarget || transferring}
                className="h-9 px-4 bg-zinc-800 hover:bg-zinc-900 disabled:opacity-50
                           text-white text-sm font-semibold rounded-md transition-colors duration-150"
              >
                이전
              </button>
            </div>
          </section>
        )}

        {/* 워크스페이스 삭제 */}
        {isOwner && (
          <section className="bg-white border border-red-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-red-700 mb-1">워크스페이스 삭제</h2>
            <p className="text-xs text-zinc-400 mb-3">
              모든 보드와 카드가 영구적으로 삭제됩니다. 되돌릴 수 없습니다.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50
                         text-white text-sm font-semibold rounded-md transition-colors duration-150"
            >
              워크스페이스 삭제
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
