'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../auth/auth-store';
import { AppShell } from '../components/AppShell';
import { AuthGuard } from '../components/AuthGuard';

export function AppProviders({ children }: { children: React.ReactNode }) {
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
      <AuthProvider>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
