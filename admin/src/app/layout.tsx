import type { Metadata } from 'next';
import { AppProviders } from '../shared/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taxi Admin',
  description: 'Operations console for Taxi Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
