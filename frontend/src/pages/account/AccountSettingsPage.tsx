import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const {
    user,
    updateProfile,
    isUpdateProfilePending,
    updateProfileError,
    changePassword,
    isChangePasswordPending,
    changePasswordError,
  } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLocalError, setPasswordLocalError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs local draft when the server profile changes
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const profileErrorMsg = (
    updateProfileError as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;
  const passwordApiErrorMsg = (
    changePasswordError as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;
  const passwordErrorMsg = passwordLocalError || passwordApiErrorMsg;

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === user?.name) return;
    await updateProfile({ name: trimmed });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordLocalError('');
    if (newPassword !== confirmPassword) {
      setPasswordLocalError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordLocalError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    await changePassword({ currentPassword, newPassword });
  };

  const isGoogleUser = user?.provider === 'google';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <nav className="bg-white border-b border-zinc-200 px-6 py-3.5 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500
                     hover:text-zinc-900 transition-colors duration-150 group"
        >
          <svg
            className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          뒤로
        </button>
      </nav>

      <div className="flex-1 overflow-auto px-6 lg:px-10 py-8 max-w-2xl w-full mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">계정 설정</h1>
          <p className="mt-1 text-sm text-zinc-500">{user?.email}</p>
        </div>

        {/* 프로필 */}
        <section className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">프로필</h2>
          {profileErrorMsg && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {profileErrorMsg}
            </div>
          )}
          <form onSubmit={handleSaveProfile} className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500">이름</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-sm
                           text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-100
                           focus:border-accent-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isUpdateProfilePending || !name.trim() || name.trim() === user?.name}
              className="self-end h-9 px-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50
                         text-white text-sm font-semibold rounded-md transition-colors duration-150"
            >
              {profileSaved ? '저장됨 ✓' : '저장'}
            </button>
          </form>
        </section>

        {/* 비밀번호 변경 */}
        {isGoogleUser ? (
          <section className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-800 mb-1">비밀번호</h2>
            <p className="text-xs text-zinc-400">
              Google 계정으로 로그인 중이라 비밀번호를 변경할 수 없습니다.
            </p>
          </section>
        ) : (
          <section className="bg-white border border-zinc-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">비밀번호 변경</h2>
            {passwordErrorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                {passwordErrorMsg}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500">현재 비밀번호</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-sm
                             text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-100
                             focus:border-accent-400 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500">새 비밀번호</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-sm
                             text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2
                             focus:ring-accent-100 focus:border-accent-400 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500">새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-sm
                             text-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-100
                             focus:border-accent-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isChangePasswordPending}
                className="h-9 px-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50
                           text-white text-sm font-semibold rounded-md transition-colors duration-150"
              >
                {isChangePasswordPending ? '변경 중...' : '비밀번호 변경'}
              </button>
              <p className="text-xs text-zinc-400">비밀번호를 변경하면 다시 로그인해야 합니다.</p>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
