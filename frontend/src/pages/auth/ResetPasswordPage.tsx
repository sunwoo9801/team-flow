import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { resetPassword, isResetPasswordPending, resetPasswordError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [done, setDone] = useState(false);

  const apiErrorMsg = (
    resetPasswordError as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;
  const errorMsg = localError || apiErrorMsg;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (password !== confirm) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setLocalError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!token) {
      setLocalError('유효하지 않은 링크입니다.');
      return;
    }
    await resetPassword({ token, newPassword: password });
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-[420px] animate-fade-in">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
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
          <span className="font-semibold text-[17px] text-zinc-900 tracking-tight">Team Flow</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
          {done ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">완료되었습니다</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-10 flex items-center justify-center gap-2
                           bg-accent-500 hover:bg-accent-600 active:bg-accent-700
                           text-white text-sm font-semibold rounded-lg transition-colors duration-150"
              >
                로그인하러 가기
              </button>
            </>
          ) : !token ? (
            <div
              className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
                          rounded-lg text-sm text-red-700"
            >
              유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해 주세요.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">새 비밀번호 설정</h1>
                <p className="mt-1 text-sm text-zinc-500">새로 사용할 비밀번호를 입력해 주세요.</p>
              </div>

              {errorMsg && (
                <div
                  className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
                              rounded-lg text-sm text-red-700"
                >
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-700">새 비밀번호</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8자 이상"
                    className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                               text-sm text-zinc-900 placeholder:text-zinc-400
                               focus:outline-none focus:ring-2 focus:ring-accent-500
                               focus:border-transparent transition-shadow duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-700">비밀번호 확인</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="동일하게 입력"
                    className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                               text-sm text-zinc-900 placeholder:text-zinc-400
                               focus:outline-none focus:ring-2 focus:ring-accent-500
                               focus:border-transparent transition-shadow duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isResetPasswordPending}
                  className="mt-2 w-full h-10 flex items-center justify-center gap-2
                             bg-accent-500 hover:bg-accent-600 active:bg-accent-700
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-white text-sm font-semibold rounded-lg transition-colors duration-150"
                >
                  {isResetPasswordPending ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          <Link to="/login" className="text-accent-600 font-semibold hover:text-accent-700 transition-colors">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
