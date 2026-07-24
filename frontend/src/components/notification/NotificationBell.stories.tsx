import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import type { Notification, NotificationPage } from '../../api/notification';

const ACTOR = { id: 'u2', name: '김철수', email: 'kim@example.com' };

function mockNotification(overrides: Partial<Notification>): Notification {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    actorId: ACTOR.id,
    type: 'MENTION',
    message: '김철수님이 카드에서 회원님을 멘션했습니다.',
    link: null,
    isRead: false,
    cardId: 'card-1',
    createdAt: new Date().toISOString(),
    actor: ACTOR,
    ...overrides,
  };
}

// react-query 훅이 실제 백엔드를 호출하지 않도록, 렌더 전에 캐시를 미리 채워 넣는다.
function withSeededQueryClient(notifications: Notification[], unreadCount: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page: NotificationPage = { items: notifications, nextCursor: null, hasNextPage: false };
  queryClient.setQueryData(['notifications', 'unread-count'], { count: unreadCount });
  queryClient.setQueryData(['notifications'], { pages: [page], pageParams: [undefined] });
  return queryClient;
}

const meta = {
  title: 'Notification/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithUnread: Story = {
  decorators: [
    Story => {
      const queryClient = withSeededQueryClient(
        [
          mockNotification({ type: 'MENTION', isRead: false }),
          mockNotification({
            type: 'CARD_ASSIGNED',
            message: '김철수님이 회원님을 카드 담당자로 지정했습니다.',
            isRead: false,
          }),
          mockNotification({
            type: 'COMMENT_ADDED',
            message: '김철수님이 담당 카드에 댓글을 남겼습니다.',
            isRead: true,
          }),
        ],
        2
      );
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};

export const Empty: Story = {
  decorators: [
    Story => {
      const queryClient = withSeededQueryClient([], 0);
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};
