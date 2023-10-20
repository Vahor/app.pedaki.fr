import { CheckStatusBanner } from '~/app/new/(paid)/check-status-banner.tsx';
import React from 'react';

export default function AfterPaymentLayout({ children }: { children: React.ReactElement }) {
  return (
    <>
      <CheckStatusBanner />
      {children}
    </>
  );
}
