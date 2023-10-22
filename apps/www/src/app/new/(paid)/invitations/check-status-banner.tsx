'use client';

import InfoCallout from '@pedaki/design/ui/callout/InfoCallout';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface CheckStatusBannerProps {
  url: string;
}

export const CheckStatusBanner: React.FC<CheckStatusBannerProps> = ({ url }) => {
  const router = useRouter();

  useEffect(() => {
    if (!url) return;

    const interval = setInterval(async () => {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
      })
        .then(response => {
          // TODO: add more check ?
          const isUp = response.status === 200;
          if (isUp) {
            clearInterval(interval);
            router.push('/new/ready');
          }
        })
        .catch(() => {
          // do nothing
        });
    }, 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [url, router]);

  return (
    <InfoCallout>
      <p>Votre workspace est en cours de création.</p>
      <p>Les invitations seront envoyées lorsque le workpace sera prêt.</p>
    </InfoCallout>
  );
};
