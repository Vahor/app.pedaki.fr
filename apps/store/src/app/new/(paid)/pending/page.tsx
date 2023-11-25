import { IconCalendarX, IconX } from '@pedaki/design/ui/icons';
import { loadInitialIsPaid } from '~/app/new/(paid)/pending/load-initial-is-paid.ts';
import WaitingForPayment from '~/app/new/(paid)/pending/WaitingForPayment.tsx';
import StatusWrapper from '~/app/status-wrapper.tsx';
import React from 'react';

export default async function PendingPaymentPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const token = searchParams.token;
  const initialIsPaid = await loadInitialIsPaid(token);
  // TODO: faire les textes (trads)

  if (initialIsPaid.status === 'invalid') {
    return (
      <StatusWrapper
        titleKey="Identifiant invalide"
        descriptionKey="L'identifiant de paiement est invalide."
        icon={IconX}
        iconClassName="text-red-9"
      />
    );
  }

  if (initialIsPaid.status === 'expired') {
    return (
      <StatusWrapper
        titleKey="Identifiant expiré"
        descriptionKey="L'identifiant de paiement est expiré."
        icon={IconCalendarX}
        iconClassName="text-red-9"
      />
    );
  }

  return <WaitingForPayment status={initialIsPaid.status} token={token!} />;
}
