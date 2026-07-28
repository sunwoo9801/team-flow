export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

export const UNASSIGNED = '__unassigned__';

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: 'all', label: '전체 마감일' },
  { value: 'overdue', label: '기한 초과' },
  { value: 'today', label: '오늘 마감' },
  { value: 'week', label: '이번 주 마감' },
  { value: 'none', label: '마감일 없음' },
];

interface Member {
  userId: string;
  user: { id: string; name: string; email: string };
}

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface Props {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  members: Member[];
  selectedAssignees: string[];
  onToggleAssignee: (value: string) => void;
  dueFilter: DueFilter;
  onDueFilterChange: (value: DueFilter) => void;
  labels: LabelOption[];
  selectedLabels: string[];
  onToggleLabel: (labelId: string) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function BoardFilterBar({
  searchInput,
  onSearchInputChange,
  members,
  selectedAssignees,
  onToggleAssignee,
  dueFilter,
  onDueFilterChange,
  labels,
  selectedLabels,
  onToggleLabel,
  hasActiveFilters,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 검색 */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={searchInput}
          onChange={e => onSearchInputChange(e.target.value)}
          placeholder="카드 검색..."
          className="h-7 w-48 pl-8 pr-3 text-[13px] bg-white border border-zinc-200 rounded-md
                     placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-100
                     focus:border-accent-400 transition-colors"
        />
      </div>

      <div className="w-px h-4 bg-zinc-200" />

      {/* 담당자 다중 선택 (칩) */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onToggleAssignee(UNASSIGNED)}
          className={`h-6 px-2 text-[11px] font-medium rounded-full border transition-colors duration-150
                      ${
                        selectedAssignees.includes(UNASSIGNED)
                          ? 'bg-accent-50 border-accent-400 text-accent-700'
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
        >
          미배정
        </button>
        {members.map(m => {
          const active = selectedAssignees.includes(m.userId);
          return (
            <button
              key={m.userId}
              onClick={() => onToggleAssignee(m.userId)}
              title={m.user.name}
              className={`h-6 pl-0.5 pr-2 flex items-center gap-1 text-[11px] font-medium rounded-full border
                          transition-colors duration-150
                          ${
                            active
                              ? 'bg-accent-50 border-accent-400 text-accent-700'
                              : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                          }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-white
                            text-[8px] font-bold uppercase ${active ? 'bg-accent-500' : 'bg-zinc-400'}`}
              >
                {m.user.name[0]}
              </span>
              {m.user.name}
            </button>
          );
        })}
      </div>

      {/* 라벨 다중 선택 */}
      {labels.length > 0 && (
        <>
          <div className="w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-1 flex-wrap">
            {labels.map(label => {
              const active = selectedLabels.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => onToggleLabel(label.id)}
                  className={`h-6 px-2 flex items-center gap-1.5 text-[11px] font-medium rounded-full border
                              transition-colors duration-150
                              ${active ? 'border-zinc-400 bg-zinc-100' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-zinc-600">{label.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="w-px h-4 bg-zinc-200" />

      {/* 마감일 필터 */}
      <select
        value={dueFilter}
        onChange={e => onDueFilterChange(e.target.value as DueFilter)}
        className="h-7 px-2 text-[11px] font-medium bg-white border border-zinc-200 rounded-md
                   text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-100
                   focus:border-accent-400 transition-colors cursor-pointer"
      >
        {DUE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="h-6 px-2 text-[11px] font-medium text-zinc-500 hover:text-red-500
                     hover:bg-red-50 rounded-md transition-colors duration-150"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
