import BaseLayout from '~/components/BaseLayout.tsx';
import type { LocaleCode } from '~/locales/server';
import { locales } from '~/locales/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactElement;
  params: { locale: LocaleCode };
}) {
  if (!locales.includes(params.locale)) {
    return notFound();
  }

  return <BaseLayout children={children} params={params} />;
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
