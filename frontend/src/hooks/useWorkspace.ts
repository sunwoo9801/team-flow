import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useWorkspaceStore } from '../store/workspace.store';
import { useEffect } from 'react';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  _count?: { members: number; boards: number };
}

export interface WorkspaceDetail extends Workspace {
  members: Array<{
    userId: string;
    role: string;
    user: { id: string; email: string; name: string };
  }>;
  boards: Array<{ id: string; title: string }>;
}

export function useWorkspaces() {
  const { setWorkspaces } = useWorkspaceStore();

  const query = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<Workspace[]>('/workspaces');
      return data;
    },
  });

  useEffect(() => {
    if (query.data) setWorkspaces(query.data);
  }, [query.data, setWorkspaces]);

  return query;
}

export function useWorkspace(workspaceId: string) {
  return useQuery<WorkspaceDetail>({
    queryKey: ['workspaces', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceDetail>(`/workspaces/${workspaceId}`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addWorkspace, setActiveWorkspace } = useWorkspaceStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<Workspace>('/workspaces', { name });
      return data;
    },
    onSuccess: ws => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      addWorkspace(ws);
      setActiveWorkspace(ws.id);
      navigate(`/workspace/${ws.id}`);
    },
  });
}

export function useCreateInvite(workspaceId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ inviteLink: string }>(`/workspaces/${workspaceId}/invite`);
      return data;
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/workspaces/invite/${token}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/workspace');
    },
  });
}
