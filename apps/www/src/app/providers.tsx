'use client';

import { TrpcProvider } from '~/server/api/providers';
import React from 'react';
import { Provider as BalancerProvider } from 'react-wrap-balancer';
import { Toaster } from 'sonner';

interface Props {
  children: React.ReactElement;
}

export const Providers = ({ children }: Props) => {
  return (
    <>
      <Toaster />
      <TrpcProvider>
        <BalancerProvider>{children}</BalancerProvider>
      </TrpcProvider>
    </>
  );
};
