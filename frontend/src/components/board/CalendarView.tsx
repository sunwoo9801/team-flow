import { useMemo, useState } from 'react';
import { priorityColor } from '../card/PriorityPicker';
import type { Card } from '../../hooks/useBoard';

interface Props {
  cards: Card[];
  onCardClick: (cardId: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarView({ cards, onCardClick }: Props) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = dateKey(new Date());

  const { cardsByDate, undated } = useMemo(() => {
    const map = new Map<string, Card[]>();
    const noDate: Card[] = [];
    for (const card of cards) {
      if (!card.dueDate) {
        noDate.push(card);
        continue;
      }
      const key = dateKey(new Date(card.dueDate));
      const list = map.get(key) ?? [];
      list.push(card);
      map.set(key, list);
    }
    return { cardsByDate: map, undated: noDate };
  }, [cards]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-800">
            {year}년 {month + 1}월
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500
                         hover:bg-zinc-100 transition-colors duration-150"
              aria-label="이전 달"
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
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500
                         hover:bg-zinc-100 transition-colors duration-150"
              aria-label="다음 달"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button
              onClick={() =>
                setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
              }
              className="ml-1 h-7 px-2.5 text-[11px] font-medium text-zinc-600 bg-white
                         border border-zinc-200 rounded-md hover:border-zinc-300 transition-colors duration-150"
            >
              오늘
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-[11px] font-semibold text-zinc-400 py-1">
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, idx) => {
            if (!date) return <div key={idx} className="min-h-[92px]" />;
            const key = dateKey(date);
            const dayCards = cardsByDate.get(key) ?? [];
            const isToday = key === today;
            return (
              <div
                key={key}
                className={`min-h-[92px] rounded-lg border p-1.5 flex flex-col gap-1
                            ${isToday ? 'border-accent-400 bg-accent-50/40' : 'border-zinc-200 bg-white'}`}
              >
                <span
                  className={`text-[11px] font-semibold tabular-nums
                              ${isToday ? 'text-accent-600' : 'text-zinc-500'}`}
                >
                  {date.getDate()}
                </span>
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayCards.slice(0, 3).map(card => (
                    <button
                      key={card.id}
                      onClick={() => onCardClick(card.id)}
                      className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left
                                 hover:bg-zinc-100 transition-colors duration-150"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: priorityColor(card.priority) }}
                      />
                      <span className="text-[10px] text-zinc-700 truncate">{card.title}</span>
                    </button>
                  ))}
                  {dayCards.length > 3 && (
                    <p className="text-[10px] text-zinc-400 px-1">+{dayCards.length - 3}개 더</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 마감일 미정 사이드 목록 */}
      <aside className="w-56 shrink-0 border-l border-zinc-200 bg-zinc-50/50 p-4 overflow-y-auto">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          마감일 미정 ({undated.length})
        </h3>
        <div className="space-y-1">
          {undated.map(card => (
            <button
              key={card.id}
              onClick={() => onCardClick(card.id)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left
                         bg-white border border-zinc-200 hover:border-zinc-300 transition-colors duration-150"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: priorityColor(card.priority) }}
              />
              <span className="text-[12px] text-zinc-700 truncate">{card.title}</span>
            </button>
          ))}
          {undated.length === 0 && (
            <p className="text-[11px] text-zinc-400 text-center py-2">없음</p>
          )}
        </div>
      </aside>
    </div>
  );
}
