import React from 'react';
import '@pedaki/design/tailwind/index.css';
import { cn } from '@pedaki/design/utils';
import { Providers } from '~/app/providers';
import { fontClassName } from '~/config/font';
import type { Metadata } from 'next';

export default function RootLayout({ children }: { children: React.ReactElement }) {
  return (
    <html lang="fr" className={cn(fontClassName)} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export const metadata = {
  metadataBase: new URL('https://app.pedaki.fr'),
  title: {
    template: '%s - Pedaki',
    default: 'Pedaki',
  },
  // TODO: add description
  description: 'todo',
  themeColor: '#ffffff',
  openGraph: {
    images: '/og-image.png',
    url: 'https://app.pedaki.fr',
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
