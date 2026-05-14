'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import uzUZ from 'antd/locale/uz_UZ';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { AuthProvider } from '../auth/auth-store';
import { AppShell } from '../components/AppShell';
import { AuthGuard } from '../components/AuthGuard';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={locale === 'uz' ? uzUZ : ruRU}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            borderRadius: 8,
            colorPrimary: '#0f766e',
            colorInfo: '#2563eb',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          components: {
            Layout: {
              bodyBg: '#f5f7fb',
              headerBg: '#ffffff',
              siderBg: '#ffffff',
            },
          },
        }}
      >
        <AuthProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
