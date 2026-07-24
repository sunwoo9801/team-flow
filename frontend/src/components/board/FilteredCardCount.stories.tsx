import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilteredCardCount } from './FilteredCardCount';

const meta = {
  title: 'Board/FilteredCardCount',
  component: FilteredCardCount,
  tags: ['autodocs'],
  argTypes: {
    filteredCount: { control: { type: 'number', min: 0 } },
    totalCount: { control: { type: 'number', min: 0 } },
  },
} satisfies Meta<typeof FilteredCardCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filtered: Story = {
  args: { filteredCount: 3, totalCount: 12, isFiltered: true },
};

export const NotFiltered: Story = {
  args: { filteredCount: 12, totalCount: 12, isFiltered: false },
};

export const NoMatches: Story = {
  args: { filteredCount: 0, totalCount: 12, isFiltered: true },
};
