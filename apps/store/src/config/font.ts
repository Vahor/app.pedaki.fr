import { cn } from '@pedaki/design/utils/cn.js';
import { Fira_Code, Inter } from 'next/font/google';

export const FontSans = Inter({
  display: 'swap',
  variable: '--font-sans',
  subsets: ['latin'],
  preload: true,
});

export const FontMono = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono',
  preload: false,
});

export const fontClassName: string = cn(FontSans.variable, FontMono.variable);
