import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <Link className="flex items-center pt-4 hover:opacity-75" href="/">
        <Image src="https://pedaki.fr/logo.svg" alt="Pedaki" width="32" height="32" />
        <span className="ml-2 text-xl font-bold">pedaki</span>
      </Link>
      <main className="relative flex justify-center">
        <div className="z-10 pt-16">{children}</div>
      </main>
    </div>
  );
}
