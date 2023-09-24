import { HandleErrorCode } from '~/app/auth/error-code';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <HandleErrorCode />
      </Suspense>
      <div className="container">
        <Link className="flex items-center pt-4 hover:opacity-75" href="/">
          <Image src="https://pedaki.fr/logo-light.svg" alt="Pedaki" width="120" height="32" />
        </Link>
        <main className="relative flex justify-center">
          <div className="z-10 pt-16">{children}</div>
        </main>
      </div>
    </>
  );
}
