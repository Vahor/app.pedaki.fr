'use client';

import { safeHistoryReplaceState } from '@pedaki/common/utils/navigation.js';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const OpenOldPayment = () => {
  const searchParams = useSearchParams();
  const getPaymentUrl = useWorkspaceFormStore(store => store.getPaymentUrl);
  const setPaymentUrl = useWorkspaceFormStore(store => store.setPaymentUrl);

  const router = useRouter();
  const pathName = usePathname();
  const initialized = useRef(false);
  const paymentUrl = getPaymentUrl();

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      if (searchParams.has('cancel')) {
        setPaymentUrl(null);
        safeHistoryReplaceState(pathName);
      } else if (paymentUrl) {
        toast('Réouvrir la page de paiement ?', {
          action: {
            label: 'Oui',
            onClick: () => {
              router.push(paymentUrl);
            },
          },
        });
      }
    }
  }, [paymentUrl, router, pathName, searchParams, setPaymentUrl]);

  return null;
};

export default OpenOldPayment;
