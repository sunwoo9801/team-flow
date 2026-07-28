import type { CardPriority } from '../../hooks/useBoard';

export const PRIORITY_OPTIONS: { value: CardPriority; label: string; color: string }[] = [
  { value: 'none', label: '없음', color: '#d4d4d8' },
  { value: 'low', label: '낮음', color: '#60a5fa' },
  { value: 'medium', label: '보통', color: '#fbbf24' },
  { value: 'high', label: '높음', color: '#fb923c' },
  { value: 'urgent', label: '긴급', color: '#ef4444' },
];

export function priorityColor(priority: CardPriority): string {
  return PRIORITY_OPTIONS.find(o => o.value === priority)?.color ?? PRIORITY_OPTIONS[0].color;
}

export function priorityLabel(priority: CardPriority): string {
  return PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? PRIORITY_OPTIONS[0].label;
}

interface Props {
  value: CardPriority;
  onChange: (value: CardPriority) => void;
}

export function PriorityPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITY_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`h-6 pl-1.5 pr-2 flex items-center gap-1.5 text-[11px] font-medium rounded-full border
                        transition-colors duration-150
                        ${active ? 'border-zinc-400 bg-zinc-100' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
            <span className="text-zinc-600">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
