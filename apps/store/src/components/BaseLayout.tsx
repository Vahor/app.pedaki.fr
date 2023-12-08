import { cn } from '@pedaki/design/utils';
import Footer from '~/app/[locale]/footer.tsx';
import Header from '~/app/[locale]/header.tsx';
import { Providers } from '~/app/providers.tsx';
import { fontClassName } from '~/config/font.ts';
import React from 'react';

const BaseLayout = ({
  children,
  params: { locale },
}: {
  children: React.ReactElement;
  params: { locale: string };
}) => {
  return (
    <html lang={locale} className={cn(fontClassName)} suppressHydrationWarning>
      <body>
        <Providers locale={locale}>
          <Header />
          <main className="container relative flex-1 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
};

export default BaseLayout;
