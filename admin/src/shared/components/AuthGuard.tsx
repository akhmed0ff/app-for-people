'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../auth/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, pathname, router]);

  return children;
}
