import type { Meta, StoryObj } from '@storybook/react-vite';
import { CursorOverlay } from './CursorOverlay';

const meta = {
  title: 'Board/CursorOverlay',
  component: CursorOverlay,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="relative w-full h-72 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CursorOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCursor: Story = {
  args: {
    cursors: [{ userId: 'u1', name: '홍길동', x: 0.3, y: 0.4, updatedAt: Date.now() }],
  },
};

export const MultipleCursors: Story = {
  args: {
    cursors: [
      { userId: 'u1', name: '홍길동', x: 0.2, y: 0.3, updatedAt: Date.now() },
      { userId: 'u2', name: '김철수', x: 0.6, y: 0.5, updatedAt: Date.now() },
      { userId: 'u3', name: '이영희', x: 0.8, y: 0.7, updatedAt: Date.now() },
    ],
  },
};

export const NoCursors: Story = {
  args: { cursors: [] },
};
