import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAcceptInvite } from '../../hooks/useWorkspace';
import { useAuthStore } from '../../store/auth.store';

interface InviteInfo {
  workspace: { id: string; name: string };
  expiresAt: string;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          {info?.workspace.name[0] ?? '?'}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">워크스페이스 초대</h1>
        <p className="text-gray-500 text-sm mb-6">
          <span className="font-semibold text-gray-800">{info?.workspace.name}</span> 워크스페이스에
          초대되었습니다.
        </p>
        <button
          onClick={handleAccept}
          disabled={isPending || !info}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? '처리 중...' : user ? '초대 수락하기' : '로그인 후 수락하기'}
        </button>
      </div>
    </div>
  );
}
