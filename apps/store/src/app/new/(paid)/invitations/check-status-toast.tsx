'use client';

import { api } from '~/server/api/clients/client.ts';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CheckStatusBannerProps {
  subdomain: string;
  baseUrl: string;
}

export const CheckStatusToast: React.FC<CheckStatusBannerProps> = ({ subdomain, baseUrl }) => {
  const router = useRouter();

  const [successCount, setSuccessCount] = useState(0);

  const { data } = api.workspace.data.getStatus.useQuery(
    { subdomain: subdomain },
    {
      refetchInterval: () => {
        // We want to make sure that the workspace is active for at least 3 checks
        if (successCount >= 3) {
          return false;
        }

        return 40_000;
      },
    },
  );

  useEffect(() => {
    if (data?.current === 'ACTIVE') {
      setSuccessCount(count => count + 1);
    } else {
      setSuccessCount(0);
    }
  }, [data]);

  useEffect(() => {
    if (successCount >= 3) {
      toast.success('Votre workspace est prêt !', {
        id: 'workspace-creation',
        action: {
          label: 'Accéder au workspace',
          onClick: () => {
            router.push(baseUrl);
          },
        },
      });
    }
  }, [successCount, router, baseUrl]);

  useEffect(() => {
    toast.loading('Création du workspace en cours', {
      id: 'workspace-creation',
      duration: Infinity,
    });
  }, []);

  return null;
};
