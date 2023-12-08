import '@pedaki/design/tailwind/index.css';
import '~/styles/index.css';
import BaseLayout from '~/components/BaseLayout.tsx';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactElement }) {
  // See [locale]/layout.tsx for more details
  return <BaseLayout children={children} params={{ locale: 'fr' }} />;
}
