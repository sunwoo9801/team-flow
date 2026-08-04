import { useState, useEffect } from 'react';
import {
  useCreateChecklistItem,
  useToggleChecklistItem,
  useUpdateChecklistItemText,
  useDeleteChecklistItem,
} from '../../hooks/useChecklist';
import type { ChecklistItem } from '../../hooks/useBoard';

interface Props {
  boardId: string;
  cardId: string;
  items: ChecklistItem[];
}

function ChecklistRow({
  item,
  onToggle,
  onSaveText,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: (done: boolean) => void;
  onSaveText: (text: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(item.text);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs local draft when another user edits the item in real time
    setText(item.text);
  }, [item.text]);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === item.text) return;
    onSaveText(trimmed);
  };

  return (
    <div className="group flex items-center gap-2 px-1 py-1 rounded-md hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={item.done}
        onChange={e => onToggle(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-zinc-300 text-accent-500 focus:ring-accent-400 shrink-0"
      />
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={`flex-1 min-w-0 text-[13px] bg-transparent border-none focus:outline-none
                    focus:ring-0 px-1 py-0.5 rounded
                    ${item.done ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}
      />
      <button
        onClick={onDelete}
        className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100
                   text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function ChecklistSection({ boardId, cardId, items }: Props) {
  const { mutate: createItem } = useCreateChecklistItem(boardId);
  const { mutate: toggleItem } = useToggleChecklistItem(boardId);
  const { mutate: updateText } = useUpdateChecklistItemText(boardId);
  const { mutate: deleteItem } = useDeleteChecklistItem(boardId);
  const [newText, setNewText] = useState('');

  const sorted = [...items].sort((a, b) => a.position - b.position);
  const doneCount = sorted.filter(i => i.done).length;

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createItem({ cardId, text: trimmed }, { onSuccess: () => setNewText('') });
  };

  return (
    <div>
      {sorted.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-150"
              style={{ width: `${(doneCount / sorted.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
            {doneCount}/{sorted.length}
          </span>
        </div>
      )}

      <div className="space-y-0.5 mb-2">
        {sorted.map(item => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggle={done => toggleItem({ itemId: item.id, done })}
            onSaveText={text => updateText({ itemId: item.id, text })}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      <input
        value={newText}
        onChange={e => setNewText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="+ 항목 추가 후 Enter"
        className="w-full text-[13px] text-zinc-600 placeholder:text-zinc-400 bg-white
                   border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none
                   focus:ring-2 focus:ring-accent-100 focus:border-accent-400 transition-colors"
      />
    </div>
  );
}
