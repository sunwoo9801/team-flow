import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';

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

export default function WorkspaceListPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { setActiveWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-fade-in">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">워크스페이스</h1>
          <p className="mt-0.5 text-sm text-zinc-500">팀과 함께 작업할 공간을 선택하세요</p>
        </div>
        <button
          onClick={() => navigate('/workspace/new')}
          className="flex items-center gap-1.5 h-9 px-4
                     bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                     text-white text-sm font-semibold rounded-lg transition-colors duration-150"
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
          새 워크스페이스
        </button>
      </div>

      {/* 그리드 */}
      {!workspaces || workspaces.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="아직 워크스페이스가 없습니다"
          description="새 워크스페이스를 만들어 팀과 협업을 시작하세요."
          action={{ label: '첫 워크스페이스 만들기', onClick: () => navigate('/workspace/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => {
            const [from, to] = getGradient(ws.name);
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  navigate(`/workspace/${ws.id}`);
                }}
                className="group text-left bg-white border border-zinc-200 rounded-2xl p-5
                           hover:border-zinc-300 hover:shadow-md
                           active:scale-[0.98] transition-all duration-150"
              >
                {/* 그라디언트 아이콘 */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to}
                                  flex items-center justify-center mb-4
                                  group-hover:scale-105 transition-transform duration-150`}
                >
                  <span className="text-white font-bold text-lg uppercase">{ws.name[0]}</span>
                </div>

                <p className="font-semibold text-zinc-900 truncate">{ws.name}</p>
                <p className="mt-1.5 text-xs text-zinc-400">
                  멤버 {ws._count?.members ?? 0}명 · 보드 {ws._count?.boards ?? 0}개
                </p>
              </button>
            );
          })}

          {/* 새 워크스페이스 카드 */}
          <button
            onClick={() => navigate('/workspace/new')}
            className="group text-left bg-zinc-50 border border-dashed border-zinc-300
                       rounded-2xl p-5 hover:bg-white hover:border-zinc-400
                       hover:shadow-sm transition-all duration-150"
          >
            <div
              className="w-11 h-11 rounded-xl border-2 border-dashed border-zinc-300
                            flex items-center justify-center mb-4
                            group-hover:border-blue-400 transition-colors duration-150"
            >
              <svg
                className="w-5 h-5 text-zinc-400 group-hover:text-blue-500
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
              className="font-semibold text-zinc-500 group-hover:text-zinc-800
                          transition-colors duration-150"
            >
              새 워크스페이스
            </p>
            <p className="mt-1.5 text-xs text-zinc-400">팀을 위한 공간 만들기</p>
          </button>
        </div>
      )}
    </div>
  );
}

function PageLoader() {
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
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-base font-semibold text-zinc-800">{title}</h2>
      <p className="mt-1.5 text-sm text-zinc-500 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-lg transition-colors duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
