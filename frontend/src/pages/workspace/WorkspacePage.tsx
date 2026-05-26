import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace, useCreateInvite } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';
import { Avatar } from '../../components/layout/Sidebar';

const GRADIENT_PAIRS = [
  ['from-blue-500', 'to-blue-600'],
  ['from-violet-500', 'to-violet-600'],
  ['from-emerald-500', 'to-emerald-600'],
  ['from-amber-500', 'to-amber-600'],
  ['from-rose-500', 'to-rose-600'],
  ['from-cyan-500', 'to-cyan-600'],
];
function getGradient(name: string) {
  const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[i];
}

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: ws, isLoading } = useWorkspace(workspaceId!);
  const { setActiveWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();
  const { mutateAsync: createInvite, isPending: inviting } = useCreateInvite(workspaceId!);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workspaceId) setActiveWorkspace(workspaceId);
  }, [workspaceId, setActiveWorkspace]);

  const handleInvite = async () => {
    const { inviteLink: link } = await createInvite();
    setInviteLink(link);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
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
          불러오는 중...
        </div>
      </div>
    );
  if (!ws) return null;

  const [from, to] = getGradient(ws.name);

  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-fade-in">
      {/* 워크스페이스 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${from} ${to}
                           flex items-center justify-center shrink-0 shadow-sm`}
          >
            <span className="text-white font-bold text-2xl uppercase">{ws.name[0]}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{ws.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              멤버 {ws.members.length}명 · 보드 {ws.boards.length}개
            </p>
          </div>
        </div>
        <button
          onClick={handleInvite}
          disabled={inviting}
          className="flex items-center gap-1.5 h-9 px-4 bg-blue-600 hover:bg-blue-700
                     disabled:opacity-50 text-white text-sm font-semibold rounded-lg
                     transition-colors duration-150 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0
                     018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          {inviting ? '생성 중...' : '멤버 초대'}
        </button>
      </div>

      {/* 초대 링크 배너 */}
      {inviteLink && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-800">초대 링크 생성됨</p>
            <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
              7일 유효
            </span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 h-9 px-3 bg-white border border-blue-200 rounded-lg
                         text-sm text-zinc-700 min-w-0 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`h-9 px-4 text-sm font-semibold rounded-lg shrink-0 transition-all duration-150
                          ${
                            copied
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 보드 목록 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">보드</h2>
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700
                         transition-colors duration-150"
            >
              + 새 보드
            </button>
          </div>
          {ws.boards.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 bg-white
                            border border-dashed border-zinc-300 rounded-2xl text-center"
            >
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-medium text-zinc-600">보드가 없습니다</p>
              <button
                onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700
                           transition-colors duration-150"
              >
                첫 번째 보드 만들기 →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ws.boards.map((board, i) => {
                const [bf, bt] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
                return (
                  <button
                    key={board.id}
                    onClick={() => navigate(`/workspace/${workspaceId}/board/${board.id}`)}
                    className="group text-left bg-white border border-zinc-200 rounded-xl p-4
                               hover:border-zinc-300 hover:shadow-md
                               active:scale-[0.98] transition-all duration-150"
                  >
                    <div className={`w-8 h-1.5 rounded-full bg-gradient-to-r ${bf} ${bt} mb-3`} />
                    <p className="font-semibold text-zinc-900 text-sm">{board.title}</p>
                    <p className="mt-1 text-xs text-zinc-400 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
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
                      보드 열기
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 멤버 목록 */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4">
            멤버
          </h2>
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            {ws.members.map((m, idx) => (
              <div
                key={m.userId}
                className={`flex items-center gap-3 px-4 py-3
                            ${idx !== ws.members.length - 1 ? 'border-b border-zinc-100' : ''}`}
              >
                <Avatar name={m.user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{m.user.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{m.user.email}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                  ${
                                    m.role === 'admin'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-zinc-100 text-zinc-600'
                                  }`}
                >
                  {m.role === 'admin' ? '관리자' : '멤버'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
