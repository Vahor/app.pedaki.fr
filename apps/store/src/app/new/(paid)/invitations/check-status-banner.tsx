'use client';

import InfoCallout from '@pedaki/design/ui/callout/InfoCallout';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface CheckStatusBannerProps {
  healthUrl: string;
  baseUrl: string;
}

export const CheckStatusBanner: React.FC<CheckStatusBannerProps> = ({ healthUrl, baseUrl }) => {
  const router = useRouter();

  useEffect(() => {
    if (!healthUrl) return;

    const interval = setInterval(async () => {
      await fetch(healthUrl, {
        method: 'HEAD',
      })
        .then(response => {
          // TODO: do more checks ?
          if (response.ok) {
            clearInterval(interval);
            router.push('/new/ready?url=' + encodeURIComponent(baseUrl));
          }
        })
        .catch(() => {
          // do nothing
        });
    }, 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [baseUrl, healthUrl, router]);

  return (
    <InfoCallout>
      <p>Votre workspace est en cours de création.</p>
      <p>Les invitations seront envoyées lorsque le workpace sera prêt.</p>
    </InfoCallout>
  );
};
