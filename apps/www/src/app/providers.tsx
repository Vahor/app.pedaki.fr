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
      <SessionProvider>
        <TrpcProvider>{children}</TrpcProvider>
      </SessionProvider>
    </>
  );
};
