import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WorkspaceFormStore {
  pendingId: string | null;
  setPendingId: (pendingId: string | null) => void;
}

export const useWorkspaceFormStore = create<WorkspaceFormStore>()(
  persist(
    set => ({
      pendingId: null,
      setPendingId: pendingId => set({ pendingId }),
    }),
    {
      name: 'workspace-form-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
