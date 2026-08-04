import type { RemoteCursor } from '../../hooks/useSocket';

const CURSOR_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#eab308'];

function colorFor(userId: string) {
  const sum = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CURSOR_COLORS[sum % CURSOR_COLORS.length];
}

export function CursorOverlay({ cursors }: { cursors: RemoteCursor[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {cursors.map(cursor => (
        <div
          key={cursor.userId}
          className="absolute transition-[left,top] duration-100 ease-out"
          style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
        >
          <svg
            className="w-4 h-4 -translate-x-0.5 -translate-y-0.5 drop-shadow"
            viewBox="0 0 16 16"
            fill={colorFor(cursor.userId)}
          >
            <path d="M1 1l6.5 13.5L9 9l5.5-1.5L1 1z" />
          </svg>
          <span
            className="ml-3 -mt-1 inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold
                       text-white whitespace-nowrap shadow-sm"
            style={{ backgroundColor: colorFor(cursor.userId) }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
}
