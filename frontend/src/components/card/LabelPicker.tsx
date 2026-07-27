import { useState } from 'react';
import {
  useBoardLabels,
  useCreateLabel,
  useAttachLabel,
  useDetachLabel,
} from '../../hooks/useLabels';
import { LABEL_COLORS } from '../../utils/labelColors';
import type { Label } from '../../api/label';

interface Props {
  boardId: string;
  cardId: string;
  cardLabels: Label[];
}

export function LabelPicker({ boardId, cardId, cardLabels }: Props) {
  const { data: allLabels } = useBoardLabels(boardId);
  const { mutate: createLabel, isPending: isCreating } = useCreateLabel(boardId);
  const { mutate: attach } = useAttachLabel(boardId);
  const { mutate: detach } = useDetachLabel(boardId);

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(LABEL_COLORS[0]);

  const attachedIds = new Set(cardLabels.map(l => l.id));

  const toggleLabel = (label: Label) => {
    if (attachedIds.has(label.id)) {
      detach({ cardId, labelId: label.id });
    } else {
      attach({ cardId, labelId: label.id });
    }
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createLabel(
      { name: trimmed, color: newColor },
      { onSuccess: () => setNewName('') }
    );
  };

  return (
    <div>
      {/* 부착된 라벨 */}
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cardLabels.map(label => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
              <button
                onClick={() => detach({ cardId, labelId: label.id })}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/20 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl
                   px-3 py-2 hover:border-zinc-300 focus:outline-none focus:ring-2
                   focus:ring-blue-100 focus:border-blue-400 transition-colors text-left"
      >
        {open ? '라벨 선택 닫기' : '+ 라벨 선택'}
      </button>

      {open && (
        <div className="mt-2 border border-zinc-200 rounded-xl p-2.5 space-y-2 bg-zinc-50/50">
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {(allLabels ?? []).map(label => (
              <li key={label.id}>
                <button
                  onClick={() => toggleLabel(label)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-left text-xs text-zinc-700 truncate">
                    {label.name}
                  </span>
                  {attachedIds.has(label.id) && (
                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            {(allLabels ?? []).length === 0 && (
              <li className="text-xs text-zinc-400 text-center py-1">라벨이 없습니다.</li>
            )}
          </ul>

          <div className="h-px bg-zinc-200" />

          {/* 새 라벨 만들기 */}
          <div className="space-y-1.5">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="새 라벨 이름"
              className="w-full h-7 px-2 text-xs bg-white border border-zinc-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <div className="flex flex-wrap gap-1.5">
              {LABEL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  aria-label={color}
                  className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                    newColor === color ? 'ring-2 ring-offset-1 ring-zinc-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="w-full h-6 text-[11px] font-semibold text-white bg-blue-600
                         hover:bg-blue-700 disabled:bg-zinc-300 rounded-lg transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
