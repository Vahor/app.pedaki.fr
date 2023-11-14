'use client';

import InfoCallout from '@pedaki/design/ui/callout/InfoCallout';
import { api } from '~/server/api/clients/client.ts';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface CheckStatusBannerProps {
  identifier: string;
  baseUrl: string;
}

export const CheckStatusBanner: React.FC<CheckStatusBannerProps> = ({ identifier, baseUrl }) => {
  const router = useRouter();

  const { data } = api.workspace.data.getStatus.useQuery(
    { identifier: identifier },
    {
      refetchInterval: data => {
        if (data?.current === 'ACTIVE') {
          return false;
        }
        return 40_000;
      },
    },
  );

  useEffect(() => {
    if (data?.current === 'ACTIVE') {
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
