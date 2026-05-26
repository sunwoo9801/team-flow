import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const FEATURES = [
  { icon: '⚡', label: '실시간 동기화 — 팀 전체가 동시에 작업' },
  { icon: '🎯', label: '드래그 앤 드롭 칸반 보드' },
  { icon: '🔗', label: '링크 하나로 간편한 팀 초대' },
];

export default function LoginPage() {
  const { login, isLoginPending, loginError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  const errorMsg = (loginError as { response?: { data?: { message?: string } } } | null)?.response
    ?.data?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(form);
  };

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* ── 좌측 브랜딩 패널 (lg+) ── */}
      <aside
        className="hidden lg:flex lg:w-[460px] xl:w-[520px] flex-col justify-between
                        bg-zinc-950 p-12 relative overflow-hidden shrink-0"
      >
        {/* 배경 그라디언트 orb */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 -left-20 w-[480px] h-[480px]
                          bg-blue-600/20 rounded-full blur-3xl"
          />
          <div
            className="absolute -bottom-40 -right-20 w-[380px] h-[380px]
                          bg-violet-600/15 rounded-full blur-3xl"
          />
        </div>

        {/* 로고 */}
        <div className="relative z-10">
          <AppLogo white />
        </div>

        {/* 헤드카피 + 기능 목록 */}
        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              팀과 함께
              <br />더 빠르게 일하세요
            </h1>
            <p className="mt-4 text-zinc-400 text-[17px] leading-relaxed">
              칸반 보드, 실시간 협업, 팀 관리를
              <br />
              하나의 공간에서
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(f => (
              <li key={f.label} className="flex items-start gap-3.5">
                <span className="text-xl leading-none mt-0.5">{f.icon}</span>
                <span className="text-zinc-300 text-sm leading-relaxed">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 하단 인용 */}
        <div className="relative z-10">
          <p className="text-zinc-500 text-sm italic">
            "좋은 디자인은 가능한 한 적게 디자인하는 것이다."
          </p>
          <p className="text-zinc-600 text-xs mt-1">— Dieter Rams</p>
        </div>
      </aside>

      {/* ── 우측 폼 패널 ── */}
      <main className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* 모바일 로고 */}
          <div className="lg:hidden mb-8">
            <AppLogo />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">다시 오셨군요</h2>
            <p className="mt-1.5 text-sm text-zinc-500">계정에 로그인해 주세요</p>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div
              className="mb-6 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200
                            rounded-xl text-sm text-red-700"
            >
              <ErrorIcon />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="이메일"
              type="email"
              value={form.email}
              onChange={v => setForm(p => ({ ...p, email: v }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="비밀번호"
              type="password"
              value={form.password}
              onChange={v => setForm(p => ({ ...p, password: v }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <PrimaryButton loading={isLoginPending} className="mt-2">
              로그인
            </PrimaryButton>
          </form>

          {/* 구분선 */}
          <Divider label="또는" className="my-6" />

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-10 flex items-center justify-center gap-2.5 bg-white
                       hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300
                       rounded-lg text-sm font-medium text-zinc-700
                       transition-colors duration-150"
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            계정이 없으신가요?{' '}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              회원가입
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

/* ── 공유 서브컴포넌트 ── */

function AppLogo({ white = false }: { white?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
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
      <span
        className={`font-semibold text-[17px] tracking-tight
                        ${white ? 'text-white' : 'text-zinc-900'}`}
      >
        Team Flow
      </span>
    </div>
  );
}

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}
function Field({ label, type, value, onChange, placeholder, autoComplete }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                   text-sm text-zinc-900 placeholder:text-zinc-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-shadow duration-150"
      />
    </div>
  );
}

function PrimaryButton({
  children,
  loading = false,
  className = '',
  type = 'submit',
  disabled,
  onClick,
}: React.PropsWithChildren<{
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`w-full h-10 flex items-center justify-center gap-2
                  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold rounded-lg
                  transition-colors duration-150 ${className}`}
    >
      {loading ? (
        <>
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
          처리 중...
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Divider({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-zinc-50 text-xs text-zinc-400 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75
               0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04
             2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23
             1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18
             C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1
             12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
