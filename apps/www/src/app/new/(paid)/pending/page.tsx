import { IconCalendarX, IconX } from '@pedaki/design/ui/icons';
import ErrorWrapper from '~/app/new/(paid)/pending/error-wrapper.tsx';
import { loadInitialIsPaid } from '~/app/new/(paid)/pending/load-initial-is-paid.ts';
import WaitingForPayment from '~/app/new/(paid)/pending/WaitingForPayment.tsx';
import React from 'react';

export default async function PendingPaymentPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pendingId = searchParams.token;
  const initialIsPaid = await loadInitialIsPaid(pendingId);

  if (initialIsPaid.status === 'invalid') {
    return (
      <ErrorWrapper
        titleKey="Identifiant invalide"
        descriptionKey="L'identifiant de paiement est invalide."
        icon={IconX}
        iconClassName="text-red-9"
      />
    );
  }

  if (initialIsPaid.status === 'expired') {
    return (
      <ErrorWrapper
        titleKey="Identifiant expiré"
        descriptionKey="L'identifiant de paiement est expiré."
        icon={IconCalendarX}
        iconClassName="text-red-9"
      />
    );
  }

  return (
    <WaitingForPayment initialIsPaid={initialIsPaid.status === 'paid'} pendingId={pendingId!} />
  );
}
