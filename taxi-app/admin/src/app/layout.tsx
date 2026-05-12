import type { Metadata } from 'next';
import { Providers } from '../components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taxi Admin',
  description: 'Admin panel for Taxi App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
