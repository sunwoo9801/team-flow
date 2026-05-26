import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateBoard } from '../../hooks/useBoard';

export default function BoardNewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [title, setTitle] = useState('');
  const { mutateAsync, isPending, error } = useCreateBoard(workspaceId!);
  const navigate = useNavigate();

  const errorMsg = (error as { response?: { data?: { message?: string } } } | null)?.response?.data
    ?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) await mutateAsync(title.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-full p-6 animate-fade-in">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-zinc-500
                     hover:text-zinc-800 transition-colors duration-150 mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          뒤로
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">새 보드 만들기</h1>
          <p className="mt-1 text-sm text-zinc-500">스프린트, 프로젝트 단위로 보드를 구성하세요</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">보드 이름</label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
                placeholder="예: Sprint 1, Q1 로드맵, 버그 트래커"
                className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-lg
                           text-sm text-zinc-900 placeholder:text-zinc-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent transition-shadow duration-150"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 h-10 border border-zinc-300 rounded-lg text-sm
                           font-medium text-zinc-700 hover:bg-zinc-50 transition-colors duration-150"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="flex-1 h-10 flex items-center justify-center gap-2
                           bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white text-sm font-semibold rounded-lg transition-colors duration-150"
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
                {isPending ? '생성 중...' : '보드 만들기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
