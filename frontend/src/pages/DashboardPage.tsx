import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-gray-900">Team Flow</h1>
          <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-700">
            로그아웃
          </button>
        </div>
        <p className="text-gray-700">안녕하세요, {user?.name ?? '사용자'}님!</p>
        <p className="text-sm text-gray-400 mt-1">2단계(레이아웃)에서 대시보드를 완성합니다.</p>
      </div>
    </div>
  );
}
