'use client';

import { api } from '~/server/api/clients/client.ts';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

export const CheckStatusBanner: React.FC = () => {
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('token');

  const { data } = api.workspace.reservation.getHealthUrl.useQuery(
    {
      id: pendingId!,
    },
    {
      enabled: !!pendingId,
    },
  );

  // TODO: add more types (unknown|up|down)
  const isUpRef = useRef<boolean>(false);

  useEffect(() => {
    if (!data || isUpRef.current) return;

    const interval = setInterval(async () => {
      await fetch(data.url, {
        method: 'HEAD',
        mode: 'no-cors',
      })
        .then(response => {
          // TODO: add more check ?
          const isUp = response.status === 200;
          if (isUp) {
            isUpRef.current = true;
            clearInterval(interval);
          }
        })
        .catch(() => {
          // do nothing
        });
    }, 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [data]);

  return <div>{isUpRef.current ? 'Up' : 'Down'}</div>;
};
