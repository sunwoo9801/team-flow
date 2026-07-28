interface Props {
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
}

export function FilteredCardCount({ filteredCount, totalCount, isFiltered }: Props) {
  if (!isFiltered) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      <span className="font-semibold text-accent-600 tabular-nums">{filteredCount}</span>
      <span>/</span>
      <span className="tabular-nums">{totalCount}</span>
      <span>카드 표시 중</span>
    </div>
  );
}
