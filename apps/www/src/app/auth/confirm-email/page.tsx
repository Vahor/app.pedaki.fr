import type { TRPCError } from '@trpc/server';
import { api } from '~/server/api/clients/server';

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { token } = searchParams;

  if (!token) {
    throw new Error('NO_TOKEN');
  }

  let error: any = null;
  // It throws an error if the token is invalid
  await api.auth.confirmEmail.mutate({ token }).catch((err: TRPCError) => {
    error = err;
  });

  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return <pre>{error.message}</pre>;
  }

  return <p>Success</p>;
}

export const metadata = {
  title: 'Confirmation email',
};
