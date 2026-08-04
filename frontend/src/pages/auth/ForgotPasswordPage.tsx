import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPasswordPage() {
  const { forgotPassword, isForgotPasswordPending } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await forgotPassword(email);
    // 계정 존재 여부와 무관하게 항상 동일하게 처리
    setSubmitted(true);
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
          <div className="mb-6">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">비밀번호 재설정</h1>
            <p className="mt-1 text-sm text-zinc-500">
              가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
            </p>
          </div>

          {submitted ? (
            <div
              className="flex items-start gap-2.5 p-3.5 bg-accent-50 border border-accent-100
                          rounded-lg text-sm text-accent-700"
            >
              <span>
                해당 이메일로 가입된 계정이 있다면 재설정 링크를 보내드렸습니다. 메일함을 확인해
                주세요.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700">이메일</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                             text-sm text-zinc-900 placeholder:text-zinc-400
                             focus:outline-none focus:ring-2 focus:ring-accent-500
                             focus:border-transparent transition-shadow duration-150"
                />
              </div>

              <button
                type="submit"
                disabled={isForgotPasswordPending}
                className="mt-2 w-full h-10 flex items-center justify-center gap-2
                           bg-accent-500 hover:bg-accent-600 active:bg-accent-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           text-white text-sm font-semibold rounded-lg transition-colors duration-150"
              >
                {isForgotPasswordPending ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          <Link
            to="/login"
            className="text-accent-600 font-semibold hover:text-accent-700 transition-colors"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
