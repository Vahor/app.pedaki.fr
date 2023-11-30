import { Button } from '@pedaki/design/ui/button';
import CurrentPage from '~/components/header/current-page.tsx';
import Logo from '~/components/header/logo.tsx';
import { env } from '~/env.mjs';
import Link from 'next/link';
import React from 'react';


const Header = () => {
  return (
    <div className="relative border-b bg-primary px-6 py-4 md:px-12">
      <header className="mx-auto max-w-screen-2xl">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <CurrentPage />
          <div>
            <Button variant="outline" asChild>
              <Link href={env.NEXT_PUBLIC_DOCS_URL}>Documentation</Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;