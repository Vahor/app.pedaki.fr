'use client';

import { TrpcProvider } from '~/server/api/providers';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { Toaster } from 'sonner';

interface Props {
  children: React.ReactElement;
}

export const Providers = ({ children }: Props) => {
  return (
    <>
      <Toaster />
      <SessionProvider refetchOnWindowFocus={true} refetchWhenOffline={false} refetchInterval={60}>
        <TrpcProvider>{children}</TrpcProvider>
      </SessionProvider>
    </>
  );
};
