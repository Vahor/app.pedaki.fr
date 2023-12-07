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

  reset: () => void;
}

export const DEFAULT_USER_DATA: WorkspaceFormStore['userData'] = {
  name: '',
  email: '',
} as const;

export const DEFAULT_SUBSCRIPTION_DATA: WorkspaceFormStore['subscriptionData'] = {
  name: '',
  subdomain: '',
  yearly: false,
} as const;

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

      userData: DEFAULT_USER_DATA,
      setUserData: userData => {
        set({ userData });
      },

      subscriptionData: DEFAULT_SUBSCRIPTION_DATA,

      setSubscriptionData: subscriptionData => {
        set({ subscriptionData });
      },

      getValidStep: () => {
        const { userData } = get();
        if (userData.name && userData.email) {
          return 1;
        }
        return 0;
      },

      reset: () => {
        set({
          paymentUrl: null,
          updatedAt: 0,
          userData: DEFAULT_USER_DATA,
          subscriptionData: DEFAULT_SUBSCRIPTION_DATA,
        });
      },
    }),
    {
      name: 'workspace-form-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
