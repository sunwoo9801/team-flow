import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

export interface Board {
  id: string;
  title: string;
  workspaceId: string;
  _count?: { columns: number };
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  assigneeId: string | null;
  columnId: string;
  assignee: { id: string; name: string; email: string } | null;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
}

export interface BoardDetail extends Board {
  columns: Column[];
}

export function useBoard(boardId: string) {
  return useQuery<BoardDetail>({
    queryKey: ['boards', boardId],
    queryFn: async () => {
      const { data } = await api.get<BoardDetail>(`/boards/${boardId}`);
      return data;
    },
    enabled: !!boardId,
  });
}

export function useCreateBoard(workspaceId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post<Board>(`/workspaces/${workspaceId}/boards`, { title });
      return data;
    },
    onSuccess: board => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
      navigate(`/workspace/${workspaceId}/board/${board.id}`);
    },
  });
}

export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.patch<Board>(`/boards/${boardId}`, { title });
      return data;
    },
    onSuccess: board => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', board.workspaceId] });
    },
  });
}

export function useDeleteBoard(workspaceId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/boards/${boardId}`);
      return boardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
      navigate(`/workspace/${workspaceId}`);
    },
  });
}
