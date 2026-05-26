import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const FIELDS = [
  { key: 'name', label: '이름', type: 'text', placeholder: '홍길동', autoComplete: 'name' },
  {
    key: 'email',
    label: '이메일',
    type: 'email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
  },
  {
    key: 'password',
    label: '비밀번호',
    type: 'password',
    placeholder: '8자 이상',
    autoComplete: 'new-password',
  },
  {
    key: 'confirm',
    label: '비밀번호 확인',
    type: 'password',
    placeholder: '동일하게 입력',
    autoComplete: 'new-password',
  },
] as const;

type FormKey = (typeof FIELDS)[number]['key'];

export default function RegisterPage() {
  const { register, isRegisterPending, registerError } = useAuth();
  const [form, setForm] = useState<Record<FormKey, string>>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [localError, setLocalError] = useState('');

  const errorMsg =
    localError ||
    (registerError as { response?: { data?: { message?: string } } } | null)?.response?.data
      ?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.confirm) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    await register({ email: form.email, name: form.name, password: form.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-[420px] animate-fade-in">
        {/* 로고 */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
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

        {/* 카드 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">계정 만들기</h1>
            <p className="mt-1 text-sm text-zinc-500">Team Flow를 무료로 시작하세요</p>
          </div>

          {errorMsg && (
            <div
              className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
                            rounded-xl text-sm text-red-700"
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75
                         0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map(({ key, label, type, placeholder, autoComplete }) => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700">{label}</label>
                <input
                  type={type}
                  required
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                             text-sm text-zinc-900 placeholder:text-zinc-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition-shadow duration-150"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isRegisterPending}
              className="mt-2 w-full h-10 flex items-center justify-center gap-2
                         bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-sm font-semibold rounded-lg transition-colors duration-150"
            >
              {isRegisterPending ? (
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
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
