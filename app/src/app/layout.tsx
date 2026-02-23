import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Calendar Copilot Lite',
  description: 'AI-assisted Google Calendar manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <TimezoneProvider>{children}</TimezoneProvider>
      </body>
    </html>
  );
}
