import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, type Comment, type CommentPage } from '../api/comment';
import { useAuthStore } from '../store/auth.store';

interface CommentsInfiniteData {
  pages: CommentPage[];
  pageParams: unknown[];
}

export function useCardComments(cardId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', cardId],
    queryFn: ({ pageParam }) => commentApi.getByCard(cardId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: !!cardId,
    staleTime: 10_000,
  });
}

export function useCreateComment(cardId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (content: string) => commentApi.create(cardId, content),
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', cardId] });
      const prev = queryClient.getQueryData<CommentsInfiniteData>(['comments', cardId]);

      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const tempComment: Comment = {
        id: tempId,
        cardId,
        userId: user?.id ?? '',
        content,
        createdAt: now,
        updatedAt: now,
        user: user
          ? { id: user.id, name: user.name, email: user.email }
          : { id: '', name: '나', email: '' },
      };

      queryClient.setQueryData<CommentsInfiniteData>(['comments', cardId], old => {
        if (!old) {
          return {
            pages: [{ items: [tempComment], nextCursor: null, hasNextPage: false }],
            pageParams: [undefined],
          };
        }
        const pages = [...old.pages];
        pages[0] = { ...pages[0], items: [tempComment, ...pages[0].items] };
        return { ...old, pages };
      });

      return { prev, tempId };
    },
    onSuccess: (comment, _content, ctx) => {
      queryClient.setQueryData<CommentsInfiniteData>(['comments', cardId], old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.map(c => (c.id === ctx?.tempId ? comment : c)),
          })),
        };
      });
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['comments', cardId], ctx.prev);
    },
  });
}

export function useDeleteComment(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentApi.remove(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', cardId] });
      const prev = queryClient.getQueryData<CommentsInfiniteData>(['comments', cardId]);
      queryClient.setQueryData<CommentsInfiniteData>(['comments', cardId], old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(p => ({ ...p, items: p.items.filter(c => c.id !== commentId) })),
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['comments', cardId], ctx.prev);
    },
  });
}
