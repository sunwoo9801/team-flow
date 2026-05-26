import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAcceptInvite } from '../../hooks/useWorkspace';
import { useAuthStore } from '../../store/auth.store';

interface InviteInfo {
  workspace: { id: string; name: string };
  expiresAt: string;
}

const GRADIENT_PAIRS = [
  ['from-blue-500', 'to-blue-600'],
  ['from-violet-500', 'to-violet-600'],
  ['from-emerald-500', 'to-emerald-600'],
];
function getGradient(name: string) {
  const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[i];
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState('');
  const { mutateAsync: accept, isPending } = useAcceptInvite();

  useEffect(() => {
    api
      .get<InviteInfo>(`/workspaces/invite/${token}`)
      .then(({ data }) => setInfo(data))
      .catch(() => setError('유효하지 않거나 만료된 초대 링크입니다.'));
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      sessionStorage.setItem('invite_token', token!);
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }
    try {
      await accept(token!);
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
          '오류가 발생했습니다.'
      );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-lg font-bold text-zinc-900 mb-1">링크를 사용할 수 없습니다</h1>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-semibold rounded-lg transition-colors duration-150"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const [from, to] = info ? getGradient(info.workspace.name) : ['from-zinc-400', 'to-zinc-500'];
  const daysLeft = info
    ? Math.ceil((new Date(info.expiresAt).getTime() - Date.now()) / 86400000)
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* 로고 */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
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
          <span className="font-semibold text-zinc-900">Team Flow</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center">
          {/* 워크스페이스 아이콘 */}
          {info && (
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${from} ${to}
                            flex items-center justify-center mx-auto mb-5 shadow-sm`}
            >
              <span className="text-white font-bold text-2xl uppercase">
                {info.workspace.name[0]}
              </span>
            </div>
          )}

          {!info ? (
            <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm py-6">
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
              확인 중...
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">초대받으셨습니다</h1>
              <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
                <span className="font-semibold text-zinc-800">{info.workspace.name}</span>
                &nbsp;워크스페이스에 합류하세요
              </p>

              {/* 만료 배지 */}
              <div
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1
                              bg-zinc-100 rounded-full text-xs text-zinc-500 font-medium"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                {daysLeft}일 후 만료
              </div>

              <button
                onClick={handleAccept}
                disabled={isPending}
                className="mt-6 w-full h-11 flex items-center justify-center gap-2
                           bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                           disabled:opacity-50 text-white text-sm font-semibold
                           rounded-xl transition-colors duration-150"
              >
                {isPending && (
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
                )}
                {user ? '초대 수락하기' : 'Google 또는 이메일로 수락하기'}
              </button>

              {!user && (
                <p className="mt-3 text-xs text-zinc-400">
                  로그인 후 자동으로 워크스페이스에 참가됩니다
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
