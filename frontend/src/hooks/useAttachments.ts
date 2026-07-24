import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentApi, type Attachment } from '../api/attachment';

export function useCardAttachments(cardId: string) {
  return useQuery({
    queryKey: ['attachments', cardId],
    queryFn: () => attachmentApi.getByCard(cardId),
    enabled: !!cardId,
    staleTime: 10_000,
  });
}

export function useUploadAttachment(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      attachmentApi.upload(cardId, file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', cardId] }),
  });
}

export function useDeleteAttachment(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentApi.remove(attachmentId),
    onMutate: async (attachmentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['attachments', cardId] });
      const prev = queryClient.getQueryData<Attachment[]>(['attachments', cardId]);
      queryClient.setQueryData<Attachment[]>(['attachments', cardId], old =>
        old?.filter(a => a.id !== attachmentId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['attachments', cardId], ctx.prev);
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentApi.getDownloadUrl(attachmentId),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}
