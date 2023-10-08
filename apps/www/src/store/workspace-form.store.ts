import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WorkspaceFormStore {
  paymentUrl: string | null;
  setPaymentUrl: (paymentUrl: string | null) => void;
}

export const useWorkspaceFormStore = create<WorkspaceFormStore>()(
  persist(
    set => ({
      paymentUrl: null,
      setPaymentUrl: paymentUrl => set({ paymentUrl }),
    }),
    {
      name: 'workspace-form-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
