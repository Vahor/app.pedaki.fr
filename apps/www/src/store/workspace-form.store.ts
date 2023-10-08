import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WorkspaceFormStore {
  paymentUrl: string | null;
  updatedAt: number;
  setPaymentUrl: (paymentUrl: string | null) => void;
  getPaymentUrl: () => string | null;
}

const isValidPaymentUrl = (paymentUrl: unknown, updatedAt: number) => {
  if (
    !paymentUrl ||
    typeof paymentUrl !== 'string' ||
    !paymentUrl.startsWith('https://checkout.stripe.com/')
  ) {
    return false;
  }
  // Max duration is 30min
  return Date.now() - updatedAt <= 1000 * 60 * 30;
};

export const useWorkspaceFormStore = create<WorkspaceFormStore>()(
  persist(
    (set, get) => ({
      paymentUrl: null,
      updatedAt: 0,
      setPaymentUrl: paymentUrl => set({ paymentUrl, updatedAt: Date.now() }),
      getPaymentUrl: () => {
        const { paymentUrl, updatedAt } = get();
        if (isValidPaymentUrl(paymentUrl, updatedAt)) {
          return paymentUrl;
        }
        return null;
      },
    }),
    {
      name: 'workspace-form-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: WorkspaceFormStore) => {
        console.log('partialize', state.paymentUrl, state.updatedAt);
        if (isValidPaymentUrl(state.paymentUrl, state.updatedAt)) {
          return { paymentUrl: state.paymentUrl, updatedAt: state.updatedAt };
        }
        return {};
      },
    },
  ),
);
