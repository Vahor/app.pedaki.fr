import React from 'react';
import '@pedaki/design/tailwind/index.css';
import { cn } from '@pedaki/design/utils';
import Header from '~/app/header.tsx';
import { Providers } from '~/app/providers';
import { fontClassName } from '~/config/font';
import type { Metadata } from 'next';

export default function RootLayout({ children }: { children: React.ReactElement }) {
  return (
    <html lang="fr" className={cn(fontClassName)} suppressHydrationWarning>
      <body>
        <Header />
        <Providers>
          <main className="container py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

export const metadata = {
  metadataBase: new URL('https://store.pedaki.fr'),
  title: {
    template: '%s - Pedaki',
    default: 'Pedaki',
  },
  // TODO: add description
  description: 'todo',
  themeColor: '#ffffff',
  openGraph: {
    images: '/og-image.png',
    url: 'https://store.pedaki.fr',
  },
  robots: 'noindex, nofollow',
  colorScheme: 'light',
  icons: [
    { rel: 'icon', url: 'https://pedaki.fr/favicon.ico' },
    { rel: 'apple-touch-icon', url: 'https://pedaki.fr/apple-touch-icon.png' },
    { rel: 'mask-icon', url: 'https://pedaki.fr/favicon.ico' },
    { rel: 'image/x-icon', url: 'https://pedaki.fr/favicon.ico' },
  ],
} satisfies Metadata;
