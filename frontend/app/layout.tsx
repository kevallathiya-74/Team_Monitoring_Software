import type { Metadata } from 'next';
import './globals.css';
import MuiThemeProvider from '@/lib/ThemeProvider';

export const metadata: Metadata = {
  title: 'WorkForce AI — Monitoring Platform',
  description: 'Real-time AI-powered workforce monitoring and intelligence platform',
  keywords: 'workforce monitoring, employee tracking, productivity analytics, AI monitoring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MuiThemeProvider>
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
