import { loadInitialIsPaid } from '~/app/new/(paid)/pending/load-initial-is-paid.ts';
import PaymentPendingIndicator from '~/app/new/(paid)/pending/PaymentPendingIndicator.tsx';
import {IconCalendarX, IconX, IconShoppingBag} from "@pedaki/design/ui/icons";
import ErrorWrapper from "~/app/new/(paid)/pending/error-wrapper.tsx";
import React from "react";

export default async function PendingPaymentPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const pendingId = searchParams.token;
  const initialIsPaid = await loadInitialIsPaid(pendingId);

  if (initialIsPaid.status === 'invalid') {
    return <ErrorWrapper
        titleKey="Identifiant invalide"
        descriptionKey="L'identifiant de paiement est invalide."
        icon={IconX}
    />
  }

  if (initialIsPaid.status === 'expired') {
    return <ErrorWrapper
        titleKey="Identifiant expiré"
        descriptionKey="L'identifiant de paiement est expiré."
        icon={IconCalendarX}
    />
  }

  if (initialIsPaid.status === 'waiting') {
      // TODO: move in PaymentPendingIndicator
    return <ErrorWrapper
        titleKey="En attente de paiement"
        descriptionKey="Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."
        icon={IconShoppingBag}
        loadingIndicator
    />
  }

  return (
    <main className="container py-8">
      <PaymentPendingIndicator
        initialIsPaid={initialIsPaid.status === 'paid'}
        pendingId={pendingId!}
      />
    </main>
  );
}
