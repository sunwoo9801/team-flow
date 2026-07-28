import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';
import type { Workspace } from '../../hooks/useWorkspace';

/* ── 워크스페이스 색상 ── */
const GRADIENTS = [
  ['from-blue-500', 'to-blue-600'],
  ['from-violet-500', 'to-violet-600'],
  ['from-emerald-500', 'to-emerald-600'],
  ['from-amber-500', 'to-amber-600'],
  ['from-rose-500', 'to-rose-600'],
  ['from-cyan-500', 'to-cyan-600'],
  ['from-indigo-500', 'to-indigo-600'],
  ['from-teal-500', 'to-teal-600'],
];
function gradient(name: string) {
  return GRADIENTS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}

/* ── 통계 카드 ── */
function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200
                      flex items-center justify-center text-xl shrink-0"
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-900 tabular-nums leading-none">{value}</div>
        <div className="text-xs font-medium text-zinc-500 mt-1">{label}</div>
        {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ── 워크스페이스 카드 ── */
function WorkspaceCard({ ws, onClick }: { ws: Workspace; onClick: () => void }) {
  const [from, to] = gradient(ws.name);
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white border border-zinc-200 rounded-xl p-5
                 hover:border-zinc-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.98]
                 transition-all duration-150 flex flex-col"
    >
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to}
                        flex items-center justify-center mb-4 shrink-0
                        group-hover:scale-105 transition-transform duration-150`}
      >
        <span className="text-white font-bold text-lg uppercase">{ws.name[0]}</span>
      </div>
      <p className="font-semibold text-zinc-900 truncate text-sm">{ws.name}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-zinc-400">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                     M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                     m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {ws._count?.members ?? 0}
        </span>
        <span className="flex items-center gap-1 text-xs text-zinc-400">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                     00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {ws._count?.boards ?? 0}
        </span>
      </div>
    </button>
  );
}

/* ── 새 워크스페이스 카드 ── */
function NewWorkspaceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-zinc-50 border border-dashed border-zinc-300
                 rounded-xl p-5 hover:bg-white hover:border-zinc-400 hover:shadow-sm
                 transition-all duration-150 flex flex-col"
    >
      <div
        className="w-11 h-11 rounded-lg border-2 border-dashed border-zinc-300
                      flex items-center justify-center mb-4 shrink-0
                      group-hover:border-accent-400 transition-colors duration-150"
      >
        <svg
          className="w-5 h-5 text-zinc-400 group-hover:text-accent-500
                        transition-colors duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p
        className="font-semibold text-sm text-zinc-500 group-hover:text-zinc-800
                    transition-colors duration-150"
      >
        새 워크스페이스
      </p>
      <p className="text-xs text-zinc-400 mt-1">팀을 위한 공간 만들기</p>
    </button>
  );
}

/* ── 우측 패널 (3xl 전용) ── */
function RightPanel({
  workspaces,
  navigate,
}: {
  workspaces: Workspace[];
  navigate: (path: string) => void;
}) {
  /* 최근 생성된 보드들을 워크스페이스에서 수집 */
  const recentWorkspaces = [...workspaces]
    .sort((a, b) => (b._count?.boards ?? 0) - (a._count?.boards ?? 0))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-8">
      {/* 빠른 접근 */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          빠른 접근
        </h3>
        <div className="space-y-1">
          {recentWorkspaces.map(ws => {
            const [from, to] = gradient(ws.name);
            return (
              <button
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                           hover:bg-zinc-50 transition-colors duration-150 group text-left"
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${from} ${to}
                                  flex items-center justify-center shrink-0`}
                >
                  <span className="text-white font-bold text-xs uppercase">{ws.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{ws.name}</p>
                  <p className="text-xs text-zinc-400">보드 {ws._count?.boards ?? 0}개</p>
                </div>
                <svg
                  className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500
                                shrink-0 transition-colors duration-150"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-px bg-zinc-100" />

      {/* 활동 가이드 */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          시작 가이드
        </h3>
        <div className="space-y-3">
          {[
            { icon: '🏢', title: '워크스페이스 만들기', done: workspaces.length > 0 },
            { icon: '📋', title: '보드 추가하기', done: (workspaces[0]?._count?.boards ?? 0) > 0 },
            { icon: '🔗', title: '팀원 초대하기', done: (workspaces[0]?._count?.members ?? 0) > 1 },
          ].map(({ icon, title, done }) => (
            <div key={title} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                              ${
                                done
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-zinc-100 text-zinc-400'
                              }`}
              >
                {done ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <span className={`text-sm ${done ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                {title}
              </span>
              <span className="text-lg ml-auto">{icon}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── 로더 / 빈 상태 ── */
function PageLoader() {
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
}

function EmptyState({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🏢</div>
      <h2 className="text-base font-semibold text-zinc-800">아직 워크스페이스가 없습니다</h2>
      <p className="mt-1.5 text-sm text-zinc-500 max-w-xs">
        새 워크스페이스를 만들어 팀과 협업을 시작하세요.
      </p>
      <button
        onClick={() => navigate('/workspace/new')}
        className="mt-6 h-9 px-5 bg-accent-500 hover:bg-accent-600 text-white
                   text-sm font-semibold rounded-lg transition-colors duration-150"
      >
        첫 워크스페이스 만들기
      </button>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function WorkspaceListPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { setActiveWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const stats = {
    workspaces: workspaces?.length ?? 0,
    boards: workspaces?.reduce((a, w) => a + (w._count?.boards ?? 0), 0) ?? 0,
    members: workspaces?.reduce((a, w) => a + (w._count?.members ?? 0), 0) ?? 0,
  };

  if (isLoading) return <PageLoader />;

  return (
    /* h-full + flex-col: 사이드바 바깥 AppLayout의 main(flex-1 overflow-auto) 안에서 */
    <div className="flex flex-col h-full animate-fade-in">
      {/* ── 페이지 헤더 (sticky, full-width) ── */}
      <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-6 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">워크스페이스</h1>
            <p className="mt-1 text-sm text-zinc-500">
              팀과 협업할 공간을 선택하거나 새로 만드세요
            </p>
          </div>
          <button
            onClick={() => navigate('/workspace/new')}
            className="flex items-center gap-1.5 h-9 px-4 bg-accent-500 hover:bg-accent-600
                       active:bg-accent-700 text-white text-sm font-semibold rounded-lg
                       transition-colors duration-150 shrink-0"
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
            <span className="hidden sm:inline">새 워크스페이스</span>
            <span className="sm:hidden">추가</span>
          </button>
        </div>

        {/* 통계 카드 — xl 이상에서 표시 */}
        <div className="hidden xl:grid grid-cols-3 gap-4 max-w-2xl">
          <StatCard icon="🏢" label="전체 워크스페이스" value={stats.workspaces} />
          <StatCard icon="📋" label="전체 보드" value={stats.boards} sub="모든 워크스페이스 합계" />
          <StatCard icon="👥" label="팀 멤버" value={stats.members} sub="중복 포함" />
        </div>
      </header>

      {/* ── 콘텐츠 + 우측 패널 (flex row) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* 메인 콘텐츠: auto-fill 그리드 */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {stats.workspaces === 0 ? (
            <EmptyState navigate={navigate} />
          ) : (
            <div className="grid-fluid">
              {workspaces?.map(ws => (
                <WorkspaceCard
                  key={ws.id}
                  ws={ws}
                  onClick={() => {
                    setActiveWorkspace(ws.id);
                    navigate(`/workspace/${ws.id}`);
                  }}
                />
              ))}
              <NewWorkspaceCard onClick={() => navigate('/workspace/new')} />
            </div>
          )}
        </main>

        {/* 우측 패널 — 3xl(1600px) 이상에서만 표시 */}
        <aside
          className="hidden 3xl:block w-72 border-l border-zinc-200 bg-white
                          shrink-0 overflow-auto"
        >
          <RightPanel workspaces={workspaces ?? []} navigate={navigate} />
        </aside>
      </div>
    </div>
  );
}
