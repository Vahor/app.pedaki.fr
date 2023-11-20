'use server';

import { api } from '~/server/api/clients/server.ts';
import { redirect } from 'next/navigation';

export default async function NewWorkspaceCancelPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pendingId = searchParams.token;

  if (pendingId && typeof pendingId === 'string') {
    await api.stripe.cancelCheckoutSession.mutate({ id: pendingId });
  }

  redirect('/new?cancel');
}
