'use client';

import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const OpenOldPayment = () => {
  const paymentUrl = useWorkspaceFormStore(store => store.paymentUrl);
  const router = useRouter();

  const initialized = useRef(false);

  useEffect(() => {
    void useWorkspaceFormStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    console.log('paymentUrl', paymentUrl);
    if (paymentUrl && !initialized.current) {
      initialized.current = true;
      // Check that it's a valid stripe urk
      if (paymentUrl.startsWith('https://checkout.stripe.com/')) {
        toast('Réouvrir la page de paiement ?', {
          action: {
            label: 'Oui',
            onClick: () => {
              router.replace(paymentUrl);
            },
          },
        });
      }
    }
  }, [paymentUrl, router]);

  return null;
};

export default OpenOldPayment;
