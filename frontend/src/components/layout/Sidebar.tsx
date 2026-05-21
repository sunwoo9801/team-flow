import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspaceStore } from '../../store/workspace.store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  return (
    <aside
      className={`
        fixed lg:relative z-30 flex flex-col
        w-64 h-full bg-gray-900 text-white shrink-0
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
      `}
    >
      {/* 로고 */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-700">
        <span className="font-bold text-lg tracking-tight">Team Flow</span>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
          ✕
        </button>
      </div>

      {/* 워크스페이스 목록 */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest px-2 mb-2">워크스페이스</p>
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => {
              setActiveWorkspace(ws.id);
              navigate(`/workspace/${ws.id}`);
              onClose();
            }}
            className={`
              w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
              ${
                activeWorkspaceId === ws.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {ws.name[0]}
              </span>
              <span className="truncate">{ws.name}</span>
            </span>
          </button>
        ))}

        <button
          onClick={() => {
            navigate('/workspace/new');
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded border border-dashed border-gray-600 flex items-center justify-center text-xs">
            +
          </span>
          새 워크스페이스
        </button>

        {/* 활성 워크스페이스의 보드 목록 */}
        {activeWorkspaceId && (
          <>
            <div className="border-t border-gray-700 my-3" />
            <p className="text-xs text-gray-400 uppercase tracking-widest px-2 mb-2">보드</p>
            <NavLink
              to={`/workspace/${activeWorkspaceId}/board/new`}
              onClick={onClose}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded border border-dashed border-gray-600 flex items-center justify-center text-xs">
                +
              </span>
              새 보드
            </NavLink>
          </>
        )}
      </div>

      {/* 유저 정보 */}
      <div className="px-4 py-3 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold uppercase shrink-0">
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
