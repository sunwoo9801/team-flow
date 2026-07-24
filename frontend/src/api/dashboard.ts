import { api } from './axios';

export interface ColumnDistributionItem {
  columnId: string;
  title: string;
  count: number;
}

export interface AssigneeDistributionItem {
  name: string;
  count: number;
}

export interface BurndownDay {
  date: string;
  opened: number;
  completed: number;
  remaining: number;
}

export interface BoardDashboard {
  totalCards: number;
  columnDistribution: ColumnDistributionItem[];
  assigneeDistribution: AssigneeDistributionItem[];
  burndown: {
    doneColumnTitle: string | null;
    days: BurndownDay[];
  };
}

export const dashboardApi = {
  getByBoard: (boardId: string): Promise<BoardDashboard> =>
    api.get(`/boards/${boardId}/dashboard`).then(r => r.data),
};
