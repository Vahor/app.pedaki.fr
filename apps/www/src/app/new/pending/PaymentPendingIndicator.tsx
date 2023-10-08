'use client';

import { Button } from '@pedaki/design/ui/button';
import { api } from '~/server/api/clients/client.ts';
import Link from 'next/link';
import React from 'react';

interface PaymentPendingIndicatorProps {
  initialIsPaid: boolean;
  pendingId: string;
}

const PaymentPendingIndicator: React.FC<PaymentPendingIndicatorProps> = ({
  initialIsPaid,
  pendingId,
}) => {
  const { data } = api.workspace.reservation.status.useQuery(
    { id: pendingId },
    {
      initialData: { paid: initialIsPaid },
      refetchInterval: data => {
        if (data?.paid) {
          return false;
        }
        return 5000;
      },
    },
  );

  if (data?.paid) {
    return (
      <div>
        Payment successful!
        <p>Message qui dit que les identifiants de base vont être envoyés par mail</p>
        <p>Et que ça peut prendre quelques minutes avant d'être disponible</p>
        <p>
          Mais que en attendant il peut commencer à configurer son espace de travail, et hop un
          bouton qui fait ça
        </p>
        <Link href={`/new/invitations?pendingId=${encodeURIComponent(pendingId)}`}>
          <Button variant="neutral">Continuer la configuration</Button>
        </Link>
      </div>
    );
  }

  return <div>Waiting for payment...</div>;
};

export default PaymentPendingIndicator;
