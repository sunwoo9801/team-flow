import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';

export default function WorkspaceListPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { setActiveWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">워크스페이스</h1>
        <button
          onClick={() => navigate('/workspace/new')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 새 워크스페이스
        </button>
      </div>
      {!workspaces || workspaces.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">워크스페이스가 없습니다</p>
          <p className="text-sm">새 워크스페이스를 만들어 팀과 협업을 시작하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => {
                setActiveWorkspace(ws.id);
                navigate(`/workspace/${ws.id}`);
              }}
              className="text-left p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold uppercase mb-3">
                {ws.name[0]}
              </div>
              <p className="font-medium text-gray-900">{ws.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                멤버 {ws._count?.members ?? 0}명 · 보드 {ws._count?.boards ?? 0}개
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
