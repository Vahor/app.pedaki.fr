'use client';

import { api } from '~/server/api/clients/client.ts';
import React from 'react';
import PaidContent from "~/app/new/pending/PaidContent.tsx";

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
    return <PaidContent pendingId={pendingId} />;
  }

  return <div>Waiting for payment...</div>;
};

export default PaymentPendingIndicator;
