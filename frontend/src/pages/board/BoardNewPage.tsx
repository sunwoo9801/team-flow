import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateBoard } from '../../hooks/useBoard';

/* ── 미니 칸반 미리보기 (우측 다크 패널) ── */
const PREVIEW_COLS = [
  {
    title: 'Todo',
    dot: 'bg-blue-400',
    cards: ['디자인 시스템 구축', 'API 문서 작성'],
  },
  {
    title: 'In Progress',
    dot: 'bg-amber-400',
    cards: ['로그인 구현', 'DB 스키마 설계'],
  },
  {
    title: 'Done',
    dot: 'bg-emerald-400',
    cards: ['초기 프로젝트 세팅'],
  },
];

function KanbanPreview({ boardName }: { boardName: string }) {
  return (
    <div className="w-full max-w-[340px]">
      {/* 레이블 */}
      <p
        className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest
                    text-center mb-4"
      >
        미리보기
      </p>

      {/* 창 프레임 */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        {/* 맥 스타일 툴바 */}
        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-zinc-500 text-xs font-medium truncate max-w-[180px]">
            {boardName.trim() || '새 보드'}
          </span>
        </div>

        {/* 칸반 본문 */}
        <div className="bg-zinc-950 p-3">
          <div className="flex gap-2.5">
            {PREVIEW_COLS.map(col => (
              <div key={col.title} className="flex-1 min-w-0">
                {/* 컬럼 헤더 */}
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot} shrink-0`} />
                  <span className="text-zinc-500 text-[10px] font-semibold truncate">
                    {col.title}
                  </span>
                  <span className="ml-auto text-[9px] text-zinc-700 tabular-nums">
                    {col.cards.length}
                  </span>
                </div>

                {/* 카드들 */}
                <div className="space-y-1.5">
                  {col.cards.map(card => (
                    <div
                      key={card}
                      className="bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2 py-1.5"
                    >
                      <p className="text-zinc-400 text-[9px] leading-snug">{card}</p>
                    </div>
                  ))}
                  {/* 빈 카드 플레이스홀더 */}
                  <div className="bg-zinc-800/30 border border-dashed border-zinc-800 rounded-lg px-2 py-2">
                    <div className="h-1.5 bg-zinc-700/30 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 기능 설명 */}
      <ul className="mt-8 space-y-4">
        {[
          { icon: '⚡', text: '기본 컬럼으로 시작, 언제든 추가·수정 가능' },
          { icon: '🎯', text: '카드를 드래그해 진행 상태를 바꾸세요' },
          { icon: '🔄', text: '팀 전체에 실시간으로 변경 사항 동기화' },
        ].map(({ icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
            <span className="text-zinc-400 text-xs leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 메인 페이지 ── */
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

      {/* ── 본문: 좌(폼) + 우(미리보기) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측: 폼 영역 ── */}
        <main className="flex-1 overflow-auto">
          {/*
            상단 정렬(top-aligned): pt-12 lg:pt-16 xl:pt-20
            좌측 여백(generous): px-6 lg:px-12 xl:px-20
            max-w로 읽기 편한 너비 제한
          */}
          <div className="px-6 lg:px-12 xl:px-20 pt-12 lg:pt-16 xl:pt-20 pb-12 max-w-[560px]">
            {/* 타이틀 그룹 */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">
                새 보드 만들기
              </h1>
              <p className="mt-2 text-base text-zinc-500 leading-relaxed">
                스프린트, 로드맵, 버그 트래커 등<br className="hidden sm:block" />
                프로젝트 단위로 보드를 구성하세요.
              </p>
            </div>

            {/* 에러 메시지 */}
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

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-800">
                  보드 이름
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="예: Sprint 1, Q1 로드맵, 버그 트래커"
                  className="w-full h-12 px-4 bg-white border border-zinc-300 rounded-xl
                             text-base text-zinc-900 placeholder:text-zinc-400
                             focus:outline-none focus:ring-2 focus:ring-accent-500
                             focus:border-transparent transition-shadow duration-150"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    만든 후에도 언제든지 이름을 변경할 수 있습니다.
                  </p>
                  <span
                    className={`text-xs tabular-nums transition-colors duration-150
                                    ${title.length > 80 ? 'text-amber-500' : 'text-zinc-400'}`}
                  >
                    {title.length}/100
                  </span>
                </div>
              </div>

              {/* 예시 이름 칩 */}
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2.5">빠른 선택</p>
                <div className="flex flex-wrap gap-2">
                  {['Sprint 1', 'Q1 로드맵', '버그 트래커', '백로그', '디자인 검토'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setTitle(name)}
                      className={`h-7 px-3 rounded-lg text-xs font-medium border
                                  transition-all duration-150
                                  ${
                                    title === name
                                      ? 'bg-accent-500 text-white border-accent-500'
                                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-accent-400 hover:text-accent-600'
                                  }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
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
                  disabled={isPending || !title.trim()}
                  className="flex-1 h-11 flex items-center justify-center gap-2
                             bg-accent-500 hover:bg-accent-600 active:bg-accent-700
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0
                                 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0
                                 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      보드 만들기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* ── 우측: 다크 미리보기 패널 (lg+) ── */}
        <aside
          className="hidden lg:flex items-start justify-center
                     w-[400px] xl:w-[460px] 2xl:w-[520px]
                     bg-zinc-950 shrink-0 overflow-auto
                     border-l border-zinc-800/60 relative"
        >
          {/* 배경 orb */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-80 h-80
                            bg-accent-500/10 rounded-full blur-3xl"
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60
                            bg-violet-600/10 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 pt-16 xl:pt-20 px-10 xl:px-14 pb-12">
            <KanbanPreview boardName={title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
