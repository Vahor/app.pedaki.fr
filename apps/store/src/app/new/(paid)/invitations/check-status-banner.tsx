'use client';

import InfoCallout from '@pedaki/design/ui/callout/InfoCallout';
import { api } from '~/server/api/clients/client.ts';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface CheckStatusBannerProps {
  token: string;
  baseUrl: string;
}

export const CheckStatusBanner: React.FC<CheckStatusBannerProps> = ({ token, baseUrl }) => {
  const router = useRouter();

  const { data } = api.workspace.reservation.readyStatus.useQuery(
    { token: token },
    {
      initialData: { ready: false },
      refetchInterval: data => {
        if (data?.ready) {
          return false;
        }
        return 40_000;
      },
    },
  );

  useEffect(() => {
    if (data?.ready) {
      router.push('/new/ready?url=' + encodeURIComponent(baseUrl));
    }
  }, [data, router, baseUrl]);

  return (
    <InfoCallout>
      <p>Votre workspace est en cours de création.</p>
      <p>Les invitations seront envoyées lorsque le workpace sera prêt.</p>
    </InfoCallout>
  );
};
