import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  addWorkspace: (ws: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    set => ({
      workspaces: [],
      activeWorkspaceId: null,
      setWorkspaces: workspaces => set({ workspaces }),
      setActiveWorkspace: id => set({ activeWorkspaceId: id }),
      addWorkspace: ws => set(s => ({ workspaces: [...s.workspaces, ws] })),
    }),
    { name: 'workspace-storage' }
  )
);
