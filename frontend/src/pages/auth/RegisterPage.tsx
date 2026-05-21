import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register, isRegisterPending, registerError } = useAuth();
  const [form, setForm] = useState({ email: '', name: '', password: '', confirm: '' });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (form.password !== form.confirm) {
      setValidationError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 8) {
      setValidationError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    await register({ email: form.email, name: form.name, password: form.password });
  };

  const error =
    validationError ||
    (registerError as { response?: { data?: { message?: string } } } | null)?.response?.data
      ?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">계정 만들기</h1>
        <p className="text-gray-500 text-sm mb-8">Team Flow를 시작해 보세요</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: '이름', key: 'name', type: 'text', placeholder: '홍길동' },
            { label: '이메일', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: '비밀번호', key: 'password', type: 'password', placeholder: '8자 이상' },
            {
              label: '비밀번호 확인',
              key: 'confirm',
              type: 'password',
              placeholder: '동일하게 입력',
            },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={isRegisterPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isRegisterPending ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
