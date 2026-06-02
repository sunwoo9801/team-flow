import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWorkspace } from '../../hooks/useWorkspace';

/* ── 워크스페이스 소개 패널 (우측 다크) ── */
function WorkspaceIntroPanel() {
  return (
    <div className="w-full max-w-[320px]">
      <p
        className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest
                    text-center mb-8"
      >
        워크스페이스란?
      </p>

      {/* 일러스트: 팀 구조 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8 shadow-xl">
        {/* 워크스페이스 */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600
                          flex items-center justify-center text-white font-bold text-sm"
          >
            T
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">팀 워크스페이스</div>
            <div className="text-[10px] text-zinc-500">3개 보드 · 5명</div>
          </div>
        </div>

        {/* 보드들 */}
        <div className="ml-4 pl-4 border-l border-zinc-800 space-y-2.5">
          {[
            { name: 'Sprint 1', dot: 'bg-blue-400', count: '12' },
            { name: 'Q1 로드맵', dot: 'bg-violet-400', count: '8' },
            { name: '버그 트래커', dot: 'bg-rose-400', count: '5' },
          ].map(({ name, dot, count }) => (
            <div key={name} className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
              <span className="text-zinc-400 text-[11px] flex-1">{name}</span>
              <span className="text-zinc-600 text-[10px] tabular-nums">{count}장</span>
            </div>
          ))}
        </div>
      </div>

      {/* 기능 목록 */}
      <ul className="space-y-4">
        {[
          { icon: '🏢', title: '팀 단위 작업 공간', desc: '하나의 워크스페이스에 여러 보드 관리' },
          { icon: '🔗', title: '링크로 팀원 초대', desc: '초대 링크를 공유하면 즉시 합류' },
          { icon: '👑', title: '관리자 권한', desc: '멤버 역할을 관리자/멤버로 구분' },
        ].map(({ icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3.5">
            <span className="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-zinc-300 text-xs font-semibold">{title}</p>
              <p className="text-zinc-500 text-[11px] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function WorkspaceNewPage() {
  const [name, setName] = useState('');
  const { mutateAsync, isPending, error } = useCreateWorkspace();
  const navigate = useNavigate();

  const errorMsg = (error as { response?: { data?: { message?: string } } } | null)?.response?.data
    ?.message;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) await mutateAsync(name.trim());
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* ── 상단 네비게이션 바 ── */}
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

      {/* ── 본문 ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측: 폼 ── */}
        <main className="flex-1 overflow-auto">
          <div className="px-6 lg:px-12 xl:px-20 pt-12 lg:pt-16 xl:pt-20 pb-12 max-w-[560px]">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
                새 워크스페이스 만들기
              </h1>
              <p className="mt-2 text-base text-zinc-500 leading-relaxed">
                팀 이름, 회사명, 또는 프로젝트 이름으로
                <br className="hidden sm:block" />
                시작하세요.
              </p>
            </div>

            {errorMsg && (
              <div
                className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-800">
                  워크스페이스 이름
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={50}
                  placeholder="예: 마케팅팀, Acme Corp, 사이드 프로젝트"
                  className="w-full h-12 px-4 bg-white border border-zinc-300 rounded-xl
                             text-base text-zinc-900 placeholder:text-zinc-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent transition-shadow duration-150"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">나중에 언제든지 변경 가능합니다.</p>
                  <span
                    className={`text-xs tabular-nums transition-colors duration-150
                                    ${name.length > 40 ? 'text-amber-500' : 'text-zinc-400'}`}
                  >
                    {name.length}/50
                  </span>
                </div>
              </div>

              {/* 예시 이름 칩 */}
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2.5">예시 이름</p>
                <div className="flex flex-wrap gap-2">
                  {['개발팀', '마케팅팀', '디자인팀', '스타트업', '사이드 프로젝트'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setName(n)}
                      className={`h-7 px-3 rounded-lg text-xs font-medium border
                                  transition-all duration-150
                                  ${
                                    name === n
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-blue-400 hover:text-blue-600'
                                  }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* 생성 후 안내 */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-zinc-700 mb-2">
                  생성 후 바로 할 수 있어요
                </p>
                <ul className="space-y-1.5">
                  {[
                    '보드 만들어 칸반 시작',
                    '초대 링크로 팀원 추가',
                    '컬럼과 카드로 작업 정리',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                      <svg
                        className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-11 px-6 border border-zinc-300 rounded-xl text-sm font-semibold
                             text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100
                             transition-colors duration-150"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="flex-1 h-11 flex items-center justify-center gap-2
                             bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-white text-sm font-semibold rounded-xl
                             transition-colors duration-150"
                >
                  {isPending ? (
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
                      생성 중...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10
                                 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3
                                 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                                 m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      워크스페이스 만들기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* ── 우측: 다크 인트로 패널 (lg+) ── */}
        <aside
          className="hidden lg:flex items-start justify-center
                     w-[380px] xl:w-[440px] 2xl:w-[500px]
                     bg-zinc-950 shrink-0 overflow-auto
                     border-l border-zinc-800/60 relative"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-80 h-80
                            bg-violet-600/10 rounded-full blur-3xl"
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60
                            bg-blue-600/10 rounded-full blur-3xl"
            />
          </div>
          <div className="relative z-10 pt-16 xl:pt-20 px-10 xl:px-14 pb-12">
            <WorkspaceIntroPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
