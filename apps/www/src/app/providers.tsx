'use client';

import { TrpcProvider } from '~/server/api/providers';
import React from 'react';
import { Toaster } from 'sonner';

interface Props {
  children: React.ReactElement;
}

export const Providers = ({ children }: Props) => {
  return (
    <>
      <Toaster />
    <TrpcProvider>{children}</TrpcProvider>
    </>
  );
};
