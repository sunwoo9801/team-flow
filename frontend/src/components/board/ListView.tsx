import { priorityColor, priorityLabel } from '../card/PriorityPicker';
import type { Column, Card } from '../../hooks/useBoard';

interface Props {
  columns: Column[];
  onCardClick: (cardId: string) => void;
}

export function ListView({ columns, onCardClick }: Props) {
  const rows = columns.flatMap(col => col.cards.map(card => ({ card, columnTitle: col.title })));

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-zinc-400">
        표시할 카드가 없습니다.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                제목
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                마감일
              </th>
              <th className="px-4 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                라벨
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ card, columnTitle }) => (
              <ListRow
                key={card.id}
                card={card}
                columnTitle={columnTitle}
                onClick={() => onCardClick(card.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListRow({
  card,
  columnTitle,
  onClick,
}: {
  card: Card;
  columnTitle: string;
  onClick: () => void;
}) {
  const overdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <tr
      onClick={onClick}
      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer transition-colors duration-150"
    >
      <td className="px-4 py-2.5 text-[13px] font-medium text-zinc-800 max-w-[280px] truncate">
        {card.title}
      </td>
      <td className="px-3 py-2.5">
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 whitespace-nowrap">
          {columnTitle}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-600 whitespace-nowrap">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor(card.priority) }}
          />
          {priorityLabel(card.priority)}
        </span>
      </td>
      <td className="px-3 py-2.5">
        {card.assignees.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {card.assignees.slice(0, 3).map(({ userId, user }) => (
              <div
                key={userId}
                className="w-5 h-5 rounded-full border-2 border-white bg-accent-500 flex items-center
                           justify-center text-white text-[9px] font-bold uppercase"
                title={user.name}
              >
                {user.name[0]}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div
                className="w-5 h-5 rounded-full border-2 border-white bg-zinc-300 flex items-center
                              justify-center text-zinc-600 text-[8px] font-bold"
              >
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-300">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {card.dueDate ? (
          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap
                        ${overdue ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'}`}
          >
            {new Date(card.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="text-[11px] text-zinc-300">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map(label => (
              <span
                key={label.id}
                className="h-1.5 w-5 rounded-full"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
