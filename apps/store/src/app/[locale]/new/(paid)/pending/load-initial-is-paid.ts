'use server';

import isNetworkError from '@pedaki/common/utils/is-network-error';
import { api } from '~/server/api/clients/server.ts';

interface LoadInitialIsPaidOutput {
  status: 'waiting' | 'paid' | 'invalid' | 'expired';
}

export const loadInitialIsPaid = async (token: unknown): Promise<LoadInitialIsPaidOutput> => {
  if (!token || typeof token !== 'string') {
    return { status: 'invalid' };
  }

  try {
    const initialIsPaid = await api.workspace.reservation.paidStatus.query({ token });
    return { status: initialIsPaid.paid ? 'paid' : 'waiting' };
  } catch (e) {
    if ((e as Error).message === 'NOT_FOUND') {
      return { status: 'expired' };
    }
    // Network error
    if (isNetworkError(e)) {
      return { status: 'waiting' };
    }
    return { status: 'invalid' };
  }
};
