import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useWorkspace } from '../../hooks/useWorkspace';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/* 워크스페이스별 색상을 이름 해시로 결정 */
const ACCENT_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
];
function wsColor(name: string) {
  const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT_COLORS.length;
  return ACCENT_COLORS[i];
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { data: activeWs } = useWorkspace(activeWorkspaceId ?? '');

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <aside
      role="navigation"
      aria-label="사이드바"
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col w-[240px]
        bg-zinc-950 border-r border-zinc-800/60
        transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* 로고 헤더 */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-800/60 shrink-0">
        <button
          onClick={() => handleNav('/workspace')}
          className="flex items-center gap-2.5 group"
          aria-label="홈으로"
        >
          <div
            className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0
                          group-hover:bg-blue-500 transition-colors duration-150"
          >
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="text-zinc-100 font-semibold text-[15px] tracking-tight">Team Flow</span>
        </button>
        {/* 모바일 닫기 */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="닫기"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-6">
        {/* 워크스페이스 섹션 */}
        <section>
          <SectionLabel>워크스페이스</SectionLabel>
          <div className="mt-1.5 space-y-0.5">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  handleNav(`/workspace/${ws.id}`);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                  transition-colors duration-150 group
                  ${
                    activeWorkspaceId === ws.id
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }
                `}
              >
                <span
                  className={`w-5 h-5 rounded-md ${wsColor(ws.name)}
                                  flex items-center justify-center
                                  text-white text-[10px] font-bold uppercase shrink-0`}
                >
                  {ws.name[0]}
                </span>
                <span className="truncate font-medium">{ws.name}</span>
                {activeWorkspaceId === ws.id && (
                  <svg
                    className="ml-auto w-3.5 h-3.5 text-zinc-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            ))}

            <button
              onClick={() => handleNav('/workspace/new')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                         text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300
                         transition-colors duration-150"
            >
              <span
                className="w-5 h-5 rounded-md border border-dashed border-zinc-700
                               flex items-center justify-center text-zinc-600 shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="font-medium">새 워크스페이스</span>
            </button>
          </div>
        </section>

        {/* 보드 섹션 (활성 워크스페이스) */}
        {activeWs && (
          <section>
            <SectionLabel>보드 — {activeWs.name}</SectionLabel>
            <div className="mt-1.5 space-y-0.5">
              {activeWs.boards.map(board => (
                <NavLink
                  key={board.id}
                  to={`/workspace/${activeWs.id}/board/${board.id}`}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }
                  `}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span className="truncate font-medium">{board.title}</span>
                </NavLink>
              ))}
              <button
                onClick={() => handleNav(`/workspace/${activeWs.id}/board/new`)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                           text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300
                           transition-colors duration-150"
              >
                <span className="w-1.5 h-1.5 rounded-full border border-zinc-600 shrink-0" />
                <span className="font-medium">새 보드</span>
              </button>
            </div>
          </section>
        )}
      </div>

      {/* 유저 푸터 */}
      <div className="shrink-0 border-t border-zinc-800/60 px-3 py-3">
        <div className="flex items-center gap-2.5 px-2">
          <Avatar name={user?.name ?? '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="로그아웃"
            className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-md
                       hover:bg-zinc-800 transition-colors duration-150"
            aria-label="로그아웃"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0
                       01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: React.PropsWithChildren) {
  return (
    <p className="px-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
      {children}
    </p>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const COLOR_MAP = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];
  const color = COLOR_MAP[name.charCodeAt(0) % COLOR_MAP.length];
  const sizeClass =
    size === 'sm'
      ? 'w-6 h-6 text-[10px]'
      : size === 'lg'
        ? 'w-10 h-10 text-base'
        : 'w-8 h-8 text-sm';
  return (
    <div
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center
                     text-white font-bold uppercase shrink-0`}
    >
      {name[0]}
    </div>
  );
}
