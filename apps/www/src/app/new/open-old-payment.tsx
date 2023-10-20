'use client';

import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const OpenOldPayment = () => {
  const getPaymentUrl = useWorkspaceFormStore(store => store.getPaymentUrl);
  const router = useRouter();

  const initialized = useRef(false);
  const paymentUrl = getPaymentUrl();

  useEffect(() => {
    if (paymentUrl && !initialized.current) {
      initialized.current = true;
      toast('Réouvrir la page de paiement ?', {
        action: {
          label: 'Oui',
          onClick: () => {
            router.push(paymentUrl);
          },
        },
      });
    }
  }, [paymentUrl, router]);

  return null;
};

export default OpenOldPayment;
