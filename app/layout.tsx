import type { Metadata, Viewport } from 'next';
import { Bungee, Sora } from 'next/font/google';
import './globals.css';

const display = Bungee({ weight: '400', subsets: ['latin'], variable: '--font-display' });
const body = Sora({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Generation Gap — Generational Trivia',
  description: 'Party trivia for Boomers, Gen X, Millennials, Gen Z, and Gen Alpha.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0a16',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
