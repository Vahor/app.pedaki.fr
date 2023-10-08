"use server";
import { api } from '~/server/api/clients/server.ts';

interface LoadInitialIsPaidOutput {
  status: 'waiting' | 'paid' | 'invalid' | 'expired';
}

export const loadInitialIsPaid = async (pendingId: unknown): Promise<LoadInitialIsPaidOutput> => {
  if (!pendingId || typeof pendingId !== 'string') {
    return { status: 'invalid' };
  }

  try {
    const initialIsPaid = await api.workspace.reservation.status.query({ id: pendingId });
    return { status: initialIsPaid ? 'paid' : 'waiting' };
  } catch (e) {
    if ((e as Error).message === 'NOT_FOUND') {
      return { status: 'expired' };
    }
    return { status: 'invalid' };
  }
};
