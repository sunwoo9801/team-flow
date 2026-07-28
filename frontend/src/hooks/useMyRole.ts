import { useAuthStore } from '../store/auth.store';
import { useWorkspace } from './useWorkspace';

export function useMyRole(workspaceId: string) {
  const { user } = useAuthStore();
  const { data: ws } = useWorkspace(workspaceId);

  const myMembership = ws?.members.find(m => m.userId === user?.id) ?? null;
  const isOwner = !!ws && !!user && ws.ownerId === user.id;
  const isAdmin = isOwner || myMembership?.role === 'admin';

  return { isOwner, isAdmin, myMembership };
}
