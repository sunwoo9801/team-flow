import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWorkspace } from '../../hooks/useWorkspace';

export default function WorkspaceNewPage() {
  const [name, setName] = useState('');
  const { mutateAsync, isPending, error } = useCreateWorkspace();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) await mutateAsync(name.trim());
  };

  return (
    <div className="max-w-lg mx-auto mt-12">
      <h1 className="text-xl font-bold text-gray-900 mb-6">새 워크스페이스 만들기</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {(error as { response?: { data?: { message?: string } } }).response?.data?.message ??
            '오류가 발생했습니다.'}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">워크스페이스 이름</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 마케팅팀"
            maxLength={50}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? '생성 중...' : '만들기'}
          </button>
        </div>
      </form>
    </div>
  );
}
