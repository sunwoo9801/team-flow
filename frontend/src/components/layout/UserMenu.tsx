import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = () => {
    clearAuth();
    setOpen(false);
    navigate('/login');
  };

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-zinc-100 transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-sm font-medium text-accent-700">
          {user?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
        </div>
        <span className="text-sm text-zinc-700 hidden sm:block">{user?.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-zinc-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => goTo('/account/settings')}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              계정 설정
            </button>
            {workspaceId && (
              <button
                onClick={() => goTo(`/workspace/${workspaceId}/settings`)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                워크스페이스 설정
              </button>
            )}
          </div>
          <div className="border-t border-zinc-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-red-500 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
