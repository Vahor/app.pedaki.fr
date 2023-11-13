'use server';

import isNetworkError from '@pedaki/common/utils/is-network-error';
import { api } from '~/server/api/clients/server.ts';

interface LoadInitialIsPaidOutput {
  status: 'waiting' | 'paid' | 'invalid' | 'expired';
}

export const loadInitialIsPaid = async (pendingId: unknown): Promise<LoadInitialIsPaidOutput> => {
  if (!pendingId || typeof pendingId !== 'string') {
    return { paidStatus: 'invalid' };
  }

  try {
    const initialIsPaid = await api.workspace.reservation.paidStatus.query({ id: pendingId });
    return { paidStatus: initialIsPaid.paid ? 'paid' : 'waiting' };
  } catch (e) {
    if ((e as Error).message === 'NOT_FOUND') {
      return { paidStatus: 'expired' };
    }
    // Network error
    if (isNetworkError(e)) {
      return { paidStatus: 'waiting' };
    }
    return { paidStatus: 'invalid' };
  }
};
