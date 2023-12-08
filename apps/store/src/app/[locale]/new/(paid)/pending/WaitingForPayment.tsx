'use client';

import { IconShoppingBag } from '@pedaki/design/ui/icons';
import IconCheck from '@pedaki/design/ui/icons/IconCheck';
import StatusWrapper from '~/app/status-wrapper.tsx';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface PaymentPendingIndicatorProps {
  status: 'paid' | 'waiting';
  token: string;
}

const WaitingForPayment: React.FC<PaymentPendingIndicatorProps> = ({ status, token }) => {
  const initialIsPaid = status === 'paid';
  const router = useRouter();

  const setPaymentUrl = useWorkspaceFormStore(store => store.setPaymentUrl);

  const { data } = api.workspace.reservation.paidStatus.useQuery(
    { token },
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

  const { data: nextToken } = api.workspace.reservation.generateToken.useQuery(
    { token },
    {
      enabled: !!data?.paid,
    },
  );

  useEffect(() => {
    if (data?.paid) {
      setPaymentUrl(null);
    }
  }, [data, setPaymentUrl]);

  useEffect(() => {
    if (nextToken) {
      void new Promise(resolve => setTimeout(resolve, 3000)).then(() => {
        router.push(`/new/invitations?token=${encodeURIComponent(nextToken)}`);
      });
    }
  }, [router, nextToken]);

  if (data?.paid) {
    return (
      <StatusWrapper
        titleKey="Redirection en cours"
        descriptionKey="Votre paiement a été validé. Votre workspace est en cours de création."
        icon={IconCheck}
        supportLink={false}
      />
    );
  }

  return (
    <StatusWrapper
      titleKey="En attente de paiement"
      descriptionKey="Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."
      icon={IconShoppingBag}
      loadingIndicator
    />
  );
};

export default WaitingForPayment;
