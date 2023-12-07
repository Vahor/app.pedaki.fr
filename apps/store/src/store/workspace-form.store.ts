import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WorkspaceFormStore {
  updatedAt: number;

  paymentUrl: string | null;
  setPaymentUrl: (paymentUrl: string | null) => void;
  getPaymentUrl: () => string | null;

  userData: {
    name: string;
    email: string;
  };
  setUserData: (userData: WorkspaceFormStore['userData']) => void;

  subscriptionData: {
    name: string;
    subdomain: string;
    yearly: boolean;
  };
  setSubscriptionData: (subscriptionData: WorkspaceFormStore['subscriptionData']) => void;

  getValidStep: () => number;
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
      setPaymentUrl: paymentUrl => {
        set({ paymentUrl, updatedAt: Date.now() });
      },
      getPaymentUrl: () => {
        const { paymentUrl, updatedAt } = get();
        if (isValidPaymentUrl(paymentUrl, updatedAt)) {
          return paymentUrl;
        }
        return null;
      },

      userData: {
        name: '',
        email: '',
      },
      setUserData: userData => {
        set({ userData });
      },

      subscriptionData: {
        name: '',
        subdomain: '',
        yearly: false,
      },

      setSubscriptionData: subscriptionData => {
        set({ subscriptionData });
      },

      getValidStep: () => {
        const { paymentUrl, userData } = get();
        if (paymentUrl) {
          return 2;
        }
        if (userData.name && userData.email) {
          return 1;
        }
        return 0;
      },
    }),
    {
      name: 'workspace-form-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
