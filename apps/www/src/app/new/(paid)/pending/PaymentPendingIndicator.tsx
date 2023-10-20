'use client';

import PaidContent from '~/app/new/(paid)/pending/PaidContent.tsx';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import React, { useEffect } from 'react';

interface PaymentPendingIndicatorProps {
  initialIsPaid: boolean;
  pendingId: string;
}

const PaymentPendingIndicator: React.FC<PaymentPendingIndicatorProps> = ({
  initialIsPaid,
  pendingId,
}) => {
  const setPaymentUrl = useWorkspaceFormStore(store => store.setPaymentUrl);

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

  useEffect(() => {
    if (data?.paid) {
      setPaymentUrl(null);
    }
  }, [data, setPaymentUrl]);

  if (data?.paid) {
    if (typeof window !== 'undefined') {
      // TODO: make sure that this is called only once
      //  If that's not the case we can use a useEffect
    }
    return <PaidContent pendingId={pendingId} />;
  }

  return <div>Waiting for payment...</div>;
};

export default PaymentPendingIndicator;
