import '@pedaki/design/tailwind/index.css';
import '~/styles/index.css';
import { fontClassName } from '~/config/font';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // See [locale]/layout.tsx for more details
  return (
    <html lang="fr" className={fontClassName} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
