'use server';

import { api } from '~/server/api/clients/server.ts';
import { redirect } from 'next/navigation';

export default async function NewWorkspaceCancelPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;

  if (token && typeof token === 'string') {
    await api.stripe.cancelCheckoutSession.mutate({ token });
  }

  redirect('/new?cancel');
}
