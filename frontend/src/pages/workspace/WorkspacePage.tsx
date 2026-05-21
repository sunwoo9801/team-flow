import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace, useCreateInvite } from '../../hooks/useWorkspace';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useEffect } from 'react';

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
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    );
  }

  if (!ws) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{ws.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            멤버 {ws._count?.members ?? ws.members.length}명 · 보드 {ws.boards.length}개
          </p>
        </div>
        <button
          onClick={handleInvite}
          disabled={inviting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {inviting ? '생성 중...' : '+ 멤버 초대'}
        </button>
      </div>

      {/* 초대 링크 */}
      {inviteLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">초대 링크 (7일 유효)</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 min-w-0"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>
        </div>
      )}

      {/* 보드 목록 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">보드</h2>
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + 새 보드
          </button>
        </div>
        {ws.boards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">아직 보드가 없습니다.</p>
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/board/new`)}
              className="mt-3 text-blue-600 text-sm font-medium hover:underline"
            >
              첫 번째 보드 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ws.boards.map(board => (
              <button
                key={board.id}
                onClick={() => navigate(`/workspace/${workspaceId}/board/${board.id}`)}
                className="text-left p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 mb-3" />
                <p className="font-medium text-gray-900">{board.title}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 멤버 목록 */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3">멤버</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {ws.members.map(m => (
            <div key={m.userId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold uppercase">
                  {m.user.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m.role === 'admin' ? '관리자' : '멤버'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
