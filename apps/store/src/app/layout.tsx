import '@pedaki/design/tailwind/index.css';
import '~/styles/index.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // See [locale]/layout.tsx for more details
  return <html>{children}</html>;
}