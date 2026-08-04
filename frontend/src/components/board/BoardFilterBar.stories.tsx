import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoardFilterBar, type DueFilter } from './BoardFilterBar';

const MEMBERS = [
  { userId: 'u1', user: { id: 'u1', name: '홍길동', email: 'hong@example.com' } },
  { userId: 'u2', user: { id: 'u2', name: '김철수', email: 'kim@example.com' } },
  { userId: 'u3', user: { id: 'u3', name: '이영희', email: 'lee@example.com' } },
];

const LABELS = [
  { id: 'l1', name: '긴급', color: '#ef4444' },
  { id: 'l2', name: '버그', color: '#f97316' },
  { id: 'l3', name: '개선', color: '#3b82f6' },
];

function InteractiveFilterBar() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  const hasActiveFilters =
    !!searchInput ||
    selectedAssignees.length > 0 ||
    selectedLabels.length > 0 ||
    dueFilter !== 'all';

  return (
    <BoardFilterBar
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      members={MEMBERS}
      selectedAssignees={selectedAssignees}
      onToggleAssignee={value => setSelectedAssignees(prev => toggle(prev, value))}
      dueFilter={dueFilter}
      onDueFilterChange={setDueFilter}
      labels={LABELS}
      selectedLabels={selectedLabels}
      onToggleLabel={value => setSelectedLabels(prev => toggle(prev, value))}
      hasActiveFilters={hasActiveFilters}
      onClear={() => {
        setSearchInput('');
        setSelectedAssignees([]);
        setSelectedLabels([]);
        setDueFilter('all');
      }}
    />
  );
}

const meta = {
  title: 'Board/BoardFilterBar',
  component: BoardFilterBar,
  tags: ['autodocs'],
} satisfies Meta<typeof BoardFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 실제 클릭/입력이 동작하는 인터랙티브 버전 — render가 자체 상태로 제어하므로 args는 사용되지 않음
export const Interactive: Story = {
  args: {
    searchInput: '',
    members: MEMBERS,
    selectedAssignees: [],
    dueFilter: 'all',
    labels: LABELS,
    selectedLabels: [],
    hasActiveFilters: false,
    onSearchInputChange: () => {},
    onToggleAssignee: () => {},
    onDueFilterChange: () => {},
    onToggleLabel: () => {},
    onClear: () => {},
  },
  render: () => <InteractiveFilterBar />,
};

export const WithActiveFilters: Story = {
  args: {
    searchInput: '로그인',
    members: MEMBERS,
    selectedAssignees: ['u1'],
    dueFilter: 'overdue',
    labels: LABELS,
    selectedLabels: ['l1'],
    hasActiveFilters: true,
    onSearchInputChange: () => {},
    onToggleAssignee: () => {},
    onDueFilterChange: () => {},
    onToggleLabel: () => {},
    onClear: () => {},
  },
};
