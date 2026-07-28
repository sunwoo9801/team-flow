import { useState } from 'react';
import { useAttachAssignee, useDetachAssignee } from '../../hooks/useKanban';
import type { CardAssignee } from '../../hooks/useBoard';

interface Member {
  userId: string;
  user: { id: string; name: string; email: string };
}

interface Props {
  boardId: string;
  cardId: string;
  cardAssignees: CardAssignee[];
  members: Member[];
}

export function AssigneePicker({ boardId, cardId, cardAssignees, members }: Props) {
  const { mutate: attach } = useAttachAssignee(boardId);
  const { mutate: detach } = useDetachAssignee(boardId);
  const [open, setOpen] = useState(false);

  const attachedIds = new Set(cardAssignees.map(a => a.userId));

  const toggleAssignee = (userId: string) => {
    if (attachedIds.has(userId)) {
      detach({ cardId, userId });
    } else {
      attach({ cardId, userId });
    }
  };

  return (
    <div>
      {cardAssignees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cardAssignees.map(({ userId, user }) => (
            <span
              key={userId}
              className="inline-flex items-center gap-1.5 h-6 pl-0.5 pr-1.5 rounded-full text-[11px]
                         font-medium bg-accent-50 border border-accent-100 text-accent-700"
            >
              <span
                className="w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center
                           text-white text-[8px] font-bold uppercase shrink-0"
              >
                {user.name[0]}
              </span>
              {user.name}
              <button
                onClick={() => detach({ cardId, userId })}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-[13px] text-zinc-600 bg-white border border-zinc-200 rounded-md
                   px-2.5 py-1.5 hover:border-zinc-300 focus:outline-none focus:ring-2
                   focus:ring-accent-100 focus:border-accent-400 transition-colors text-left"
      >
        {open ? '담당자 선택 닫기' : '+ 담당자 선택'}
      </button>

      {open && (
        <div className="mt-2 border border-zinc-200 rounded-md p-2.5 bg-zinc-50/50">
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {members.map(m => (
              <li key={m.userId}>
                <button
                  onClick={() => toggleAssignee(m.userId)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-full bg-zinc-400 flex items-center justify-center
                               text-white text-[9px] font-bold uppercase shrink-0"
                  >
                    {m.user.name[0]}
                  </span>
                  <span className="flex-1 text-left text-xs text-zinc-700 truncate">
                    {m.user.name}
                  </span>
                  {attachedIds.has(m.userId) && (
                    <svg
                      className="w-3.5 h-3.5 text-accent-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            {members.length === 0 && (
              <li className="text-xs text-zinc-400 text-center py-1">멤버가 없습니다.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
