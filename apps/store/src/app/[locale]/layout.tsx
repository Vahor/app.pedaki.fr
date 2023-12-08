import { cn } from '@pedaki/design/utils';
import Footer from '~/app/[locale]/footer.tsx';
import Header from '~/app/[locale]/header.tsx';
import { Providers } from '~/app/providers';
import { fontClassName } from '~/config/font';
import type { LocaleCode } from '~/locales/server';
import { locales } from '~/locales/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactElement;
  params: { locale: LocaleCode };
}) {
  if (!locales.includes(locale)) {
    return notFound();
  }

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
}

export const viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export const metadata = {
  metadataBase: new URL('https://store.pedaki.fr'),
  title: {
    template: '%s - Pedaki',
    default: 'Pedaki',
  },
  // TODO: add description
  description: 'todo',
  openGraph: {
    images: '/og-image.png',
    url: 'https://store.pedaki.fr',
  },
  robots: 'noindex, nofollow',
  icons: [
    { rel: 'icon', url: 'https://static.pedaki.fr/logo/favicon.ico' },
    { rel: 'apple-touch-icon', url: 'https://static.pedaki.fr/logo/apple-touch-icon.png' },
    { rel: 'mask-icon', url: 'https:/static.pedaki.fr/logo/favicon.ico' },
    { rel: 'image/x-icon', url: 'https://static.pedaki.fr/logo/favicon.ico' },
  ],
} satisfies Metadata;
