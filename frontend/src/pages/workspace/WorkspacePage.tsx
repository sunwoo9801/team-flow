import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace, useCreateInvite } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';

const GRADIENTS = [
  ['from-blue-500', 'to-blue-600'],
  ['from-violet-500', 'to-violet-600'],
  ['from-emerald-500', 'to-emerald-600'],
  ['from-amber-500', 'to-amber-600'],
  ['from-rose-500', 'to-rose-600'],
  ['from-cyan-500', 'to-cyan-600'],
];
function gradient(name: string) {
  return GRADIENTS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}
function avatarColor(name: string) {
  const COLORS = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

/* ── 좌측 메타 패널 (3xl 전용) ── */
function LeftMetaPanel({ ws }: { ws: NonNullable<ReturnType<typeof useWorkspace>['data']> }) {
  const [from, to] = gradient(ws.name);
  return (
    <aside
      className="hidden 3xl:flex flex-col w-64 border-r border-zinc-200 bg-white
                      shrink-0 overflow-auto"
    >
      <div className="p-6 border-b border-zinc-100">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${from} ${to}
                          flex items-center justify-center shadow-sm mb-4`}
        >
          <span className="text-white font-bold text-2xl uppercase">{ws.name[0]}</span>
        </div>
        <h2 className="font-bold text-zinc-900 text-base leading-tight">{ws.name}</h2>
        <p className="text-xs text-zinc-400 mt-1">{ws.members.length}명의 팀원이 협업 중</p>
      </div>

      <div className="p-6 space-y-4">
        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '보드', value: ws.boards.length, icon: '📋' },
            { label: '멤버', value: ws.members.length, icon: '👥' },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-center"
            >
              <div className="text-xl mb-0.5">{icon}</div>
              <div className="text-xl font-bold text-zinc-900 tabular-nums">{value}</div>
              <div className="text-[10px] text-zinc-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        <div className="h-px bg-zinc-100" />

        {/* 역할 안내 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">내 권한</p>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold
                             bg-blue-100 text-blue-700"
            >
              {ws.members.find(() => true)?.role === 'admin' ? '관리자' : '멤버'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── 우측 멤버 패널 (xl+) ── */
function MembersPanel({ ws }: { ws: NonNullable<ReturnType<typeof useWorkspace>['data']> }) {
  return (
    <aside
      className="hidden xl:flex flex-col w-72 3xl:w-80 border-l border-zinc-200 bg-white
                      shrink-0 overflow-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">팀 멤버</h3>
          <span className="text-xs font-semibold text-zinc-400 tabular-nums">
            {ws.members.length}
          </span>
        </div>

        <div className="space-y-1">
          {ws.members.map(m => (
            <div
              key={m.userId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                            hover:bg-zinc-50 transition-colors duration-150"
            >
              <div
                className={`w-8 h-8 rounded-full ${avatarColor(m.user.name)}
                               flex items-center justify-center text-white text-xs
                               font-bold uppercase shrink-0`}
              >
                {m.user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{m.user.name}</p>
                <p className="text-xs text-zinc-400 truncate">{m.user.email}</p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                ${
                                  m.role === 'admin'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-zinc-100 text-zinc-500'
                                }`}
              >
                {m.role === 'admin' ? '관리자' : '멤버'}
              </span>
            </div>
          ))}
        </div>

        {/* xl에서만 보이는 멤버 요약 (패널 없을 때) */}
      </div>
    </aside>
  );
}

/* ── 초대 배너 ── */
function InviteBanner({
  link,
  onCopy,
  copied,
}: {
  link: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div
      className="mx-6 lg:mx-8 mt-4 p-4 bg-blue-50 border border-blue-200
                    rounded-2xl animate-fade-in shrink-0"
    >
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-semibold text-blue-800">초대 링크 생성됨</p>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
          7일 유효
        </span>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 h-9 px-3 bg-white border border-blue-200 rounded-lg
                          text-sm text-zinc-700 min-w-0 focus:outline-none"
        />
        <button
          onClick={onCopy}
          className={`h-9 px-4 text-sm font-semibold rounded-lg shrink-0
                      transition-all duration-150
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
  );
}

/* ── 메인 페이지 ── */
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
      <div className="flex items-center justify-center h-64 gap-2 text-zinc-400 text-sm">
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
    );
  if (!ws) return null;

  const [from, to] = gradient(ws.name);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* ── 워크스페이스 히어로 헤더 (full-width) ── */}
      <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${from} ${to}
                              flex items-center justify-center shadow-sm shrink-0`}
            >
              <span className="text-white font-bold text-xl uppercase">{ws.name[0]}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight truncate">{ws.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-zinc-400">보드 {ws.boards.length}개</span>
                <span className="text-zinc-300">·</span>
                <span className="text-xs text-zinc-400">멤버 {ws.members.length}명</span>
                {/* xl 미만에서 멤버 아바타 표시 */}
                <div className="xl:hidden flex items-center -space-x-1.5">
                  {ws.members.slice(0, 4).map(m => (
                    <div
                      key={m.userId}
                      className={`w-5 h-5 rounded-full border-2 border-white
                                     ${avatarColor(m.user.name)}
                                     flex items-center justify-center
                                     text-white text-[8px] font-bold uppercase`}
                    >
                      {m.user.name[0]}
                    </div>
                  ))}
                  {ws.members.length > 4 && (
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white bg-zinc-300
                                    flex items-center justify-center text-zinc-600 text-[8px] font-bold"
                    >
                      +{ws.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
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
            <span className="hidden sm:inline">{inviting ? '생성 중...' : '멤버 초대'}</span>
          </button>
        </div>
      </header>

      {/* 초대 배너 */}
      {inviteLink && <InviteBanner link={inviteLink} onCopy={handleCopy} copied={copied} />}

      {/* ── 3열 본문 레이아웃 ── */}
      {/*
          모바일: 단일 스크롤
          xl:   [보드 flex-1] + [멤버 패널 w-72]
          3xl:  [메타 w-64] + [보드 flex-1] + [멤버 w-80]
      */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 메타 패널 (3xl+) */}
        <LeftMetaPanel ws={ws} />

        {/* 중앙 보드 그리드 */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">보드</h2>
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
              className="flex flex-col items-center justify-center py-16
                            bg-white border border-dashed border-zinc-300 rounded-2xl text-center"
            >
              <div className="text-4xl mb-3">📋</div>
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
            /* auto-fill 보드 그리드 */
            <div className="grid-fluid-sm">
              {ws.boards.map((board, i) => {
                const [bf, bt] = GRADIENTS[i % GRADIENTS.length];
                return (
                  <button
                    key={board.id}
                    onClick={() => navigate(`/workspace/${workspaceId}/board/${board.id}`)}
                    className="group text-left bg-white border border-zinc-200 rounded-xl p-4
                               hover:border-zinc-300 hover:shadow-md active:scale-[0.98]
                               transition-all duration-150"
                  >
                    {/* 컬러 액센트 바 */}
                    <div className={`w-full h-1 rounded-full bg-gradient-to-r ${bf} ${bt} mb-4`} />
                    <p className="font-semibold text-zinc-900 text-sm truncate">{board.title}</p>
                    <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
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
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      보드 열기
                    </p>
                  </button>
                );
              })}

              {/* 보드 추가 카드 */}
              <button
                onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
                className="group text-left bg-zinc-50 border border-dashed border-zinc-300
                           rounded-xl p-4 hover:bg-white hover:border-zinc-400
                           transition-all duration-150"
              >
                <div
                  className="w-full h-1 rounded-full bg-zinc-200 mb-4
                                group-hover:bg-blue-200 transition-colors duration-150"
                />
                <p
                  className="text-sm font-semibold text-zinc-500
                               group-hover:text-zinc-800 transition-colors duration-150"
                >
                  + 새 보드
                </p>
                <p className="mt-2 text-xs text-zinc-400">스프린트 또는 프로젝트</p>
              </button>
            </div>
          )}

          {/* xl 미만: 멤버 섹션을 하단에 표시 */}
          <section className="xl:hidden mt-8">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-4">
              팀 멤버
            </h2>
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              {ws.members.map((m, idx) => (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 px-4 py-3
                                 ${
                                   idx !== ws.members.length - 1 ? 'border-b border-zinc-100' : ''
                                 }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full ${avatarColor(m.user.name)}
                                   flex items-center justify-center text-white
                                   text-xs font-bold uppercase shrink-0`}
                  >
                    {m.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{m.user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{m.user.email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                                    ${
                                      m.role === 'admin'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-zinc-100 text-zinc-500'
                                    }`}
                  >
                    {m.role === 'admin' ? '관리자' : '멤버'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* 우측 멤버 패널 (xl+) */}
        <MembersPanel ws={ws} />
      </div>
    </div>
  );
}
