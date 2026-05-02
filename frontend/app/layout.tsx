import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MuiThemeProvider from '@/lib/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'WorkForce AI — Monitoring Platform',
  description: 'Real-time AI-powered workforce monitoring and intelligence platform',
  keywords: 'workforce monitoring, employee tracking, productivity analytics, AI monitoring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MuiThemeProvider>
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
