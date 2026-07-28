import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useBoard } from '../../hooks/useBoard';
import { useAuthStore } from '../../store/auth.store';
import { NotificationBell } from '../notification/NotificationBell';


interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams<{ workspaceId?: string; boardId?: string }>();
  const { workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find(w => w.id === workspaceId);
  const { data: board } = useBoard(boardId ?? '');
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header
      className="h-14 bg-white border-b border-zinc-200 flex items-center
                       gap-3 px-4 shrink-0 z-10"
    >
      {/* 햄버거 (모바일) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-800
                   hover:bg-zinc-100 transition-colors duration-150"
        aria-label="메뉴 열기"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 브레드크럼 */}
      <nav aria-label="위치" className="flex items-center gap-1.5 flex-1 min-w-0 text-sm">
        {activeWs ? (
          <>
            <button
              onClick={() => navigate(`/workspace/${activeWs.id}`)}
              className="font-medium text-zinc-500 hover:text-zinc-900
                         truncate transition-colors duration-150 max-w-[140px]"
            >
              {activeWs.name}
            </button>
            {board && (
              <>
                <svg
                  className="w-3.5 h-3.5 text-zinc-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
                <span className="font-semibold text-zinc-900 truncate">{board.title}</span>
              </>
            )}
          </>
        ) : (
          <span className="font-semibold text-zinc-900">홈</span>
        )}
      </nav>

      {/* 우측 액션 */}
      <div className="flex items-center gap-2 shrink-0">
        {workspaceId && !boardId && (
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3
                       bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium
                       rounded-md transition-colors duration-150"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 보드
          </button>
        )}

        <NotificationBell />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-sm font-medium text-accent-700">
            {user?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
          </div>
          <span className="text-sm text-zinc-700 hidden sm:block">{user?.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
