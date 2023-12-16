import { cn } from '@pedaki/design/utils';
import { fontClassName } from '~/config/font';
import { fallbackLocale } from '~/locales/shared';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // TODO: not possible atm, but we should change the lang to the current locale
  return (
    <html lang={fallbackLocale} dir="ltr" className={cn(fontClassName)} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
