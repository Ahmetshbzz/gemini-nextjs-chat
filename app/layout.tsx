// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kanki Gemini Sohbet',
  description: 'Arkadaşın Gemini ile takıl, muhabbet et! Next.js 15.3 ile geliştirildi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <main className="min-h-screen flex flex-col items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
