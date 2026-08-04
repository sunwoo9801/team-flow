import axios from 'axios';
import { api } from './axios';

export interface AttachmentUser {
  id: string;
  name: string;
  email: string;
}

export interface Attachment {
  id: string;
  cardId: string;
  userId: string;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  user: AttachmentUser;
}

interface PresignResponse {
  uploadUrl: string;
  key: string;
}

export const attachmentApi = {
  getByCard: (cardId: string): Promise<Attachment[]> =>
    api.get(`/cards/${cardId}/attachments`).then(r => r.data),

  upload: async (
    cardId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> => {
    const { data: presign } = await api.post<PresignResponse>(
      `/cards/${cardId}/attachments/presign`,
      {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }
    );

    // presigned URL은 S3로 직접 업로드 — 인증 인터셉터가 붙은 axios 인스턴스를 피하기 위해 별도 axios 사용
    await axios.put(presign.uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      onUploadProgress: evt => {
        if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });

    const { data: attachment } = await api.post<Attachment>(`/cards/${cardId}/attachments`, {
      fileName: file.name,
      fileKey: presign.key,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
    });

    return attachment;
  },

  getDownloadUrl: (attachmentId: string): Promise<{ url: string; fileName: string }> =>
    api.get(`/attachments/${attachmentId}/download-url`).then(r => r.data),

  remove: (attachmentId: string): Promise<void> =>
    api.delete(`/attachments/${attachmentId}`).then(r => r.data),
};
