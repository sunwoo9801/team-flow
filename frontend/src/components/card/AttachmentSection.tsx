import { useRef, useState } from 'react';
import {
  useCardAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  useDownloadAttachment,
} from '../../hooks/useAttachments';
import { useAuthStore } from '../../store/auth.store';
import type { Attachment } from '../../api/attachment';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const isImage = mimeType.startsWith('image/');
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500">
      {isImage ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
        </svg>
      )}
    </div>
  );
}

function AttachmentItem({
  attachment,
  canDelete,
  onDownload,
  onDelete,
}: {
  attachment: Attachment;
  canDelete: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 py-2 group">
      <FileIcon mimeType={attachment.mimeType} />
      <div className="flex-1 min-w-0">
        <button
          onClick={onDownload}
          className="text-[13px] text-zinc-700 hover:text-accent-600 truncate block text-left w-full transition-colors"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </button>
        <p className="text-xs text-zinc-400">
          {formatFileSize(attachment.fileSize)} · {attachment.user.name}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs text-zinc-400
                     hover:text-red-500 transition-all duration-150"
        >
          삭제
        </button>
      )}
    </li>
  );
}

export function AttachmentSection({ cardId }: { cardId: string }) {
  const { user } = useAuthStore();
  const { data: attachments, isLoading } = useCardAttachments(cardId);
  const { mutate: upload } = useUploadAttachment(cardId);
  const { mutate: remove } = useDeleteAttachment(cardId);
  const { mutate: download } = useDownloadAttachment();

  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    setError(null);
    setProgress(0);
    upload(
      { file, onProgress: setProgress },
      {
        onSettled: () => setProgress(null),
        onError: () => setError('업로드에 실패했습니다.'),
      }
    );
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
          className="h-7 px-3 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200
                     disabled:opacity-50 rounded-md transition-colors duration-150"
        >
          {progress !== null ? `업로드 중... ${progress}%` : '파일 추가'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {isLoading ? (
        <div className="space-y-2 py-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 py-1">
                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                <div className="h-2 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !attachments || attachments.length === 0 ? (
        <p className="text-sm text-gray-400 py-2 text-center">첨부파일이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {attachments.map(attachment => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              canDelete={attachment.userId === user?.id}
              onDownload={() => download(attachment.id)}
              onDelete={() => remove(attachment.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
