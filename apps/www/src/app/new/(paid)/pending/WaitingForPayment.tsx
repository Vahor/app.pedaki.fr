'use client';

import { IconShoppingBag } from '@pedaki/design/ui/icons';
import ErrorWrapper from '~/app/new/(paid)/pending/error-wrapper.tsx';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import React, { useEffect } from 'react';

interface PaymentPendingIndicatorProps {
  initialIsPaid: boolean;
  pendingId: string;
}

const WaitingForPayment: React.FC<PaymentPendingIndicatorProps> = ({
  initialIsPaid,
  pendingId,
}) => {
  const setPaymentUrl = useWorkspaceFormStore(store => store.setPaymentUrl);

  const { data } = api.workspace.reservation.status.useQuery(
    { id: pendingId },
    {
      initialData: { paid: initialIsPaid },
      refetchInterval: data => {
        if (initialIsPaid || data?.paid) {
          return false;
        }
        return 3000;
      },
    },
  );

  useEffect(() => {
    if (data?.paid) {
      setPaymentUrl(null);
    }
  }, [data, setPaymentUrl]);

  if (data?.paid) {
    return <span>todo redirect</span>;
  }

  return (
    <ErrorWrapper
      titleKey="En attente de paiement"
      descriptionKey="Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."
      icon={IconShoppingBag}
      loadingIndicator
    />
  );
};

export default WaitingForPayment;
