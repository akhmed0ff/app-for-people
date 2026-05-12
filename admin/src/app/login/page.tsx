'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../../shared/api/admin-api';
import { useAuth } from '../../shared/auth/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const login = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (tokens) => {
      auth.setTokens(tokens);
      router.replace('/');
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-sm">
        <p className="text-sm font-black uppercase text-brand">Taxi Admin</p>
        <h1 className="mt-2 text-3xl font-black">Admin Login</h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          Local development login uses the backend admin dev-login endpoint.
        </p>
        <button
          className="mt-6 h-12 w-full rounded-lg bg-brand px-4 font-black text-white disabled:opacity-50"
          disabled={login.isPending}
          onClick={() => login.mutate()}
          type="button"
        >
          {login.isPending ? 'Signing in' : 'Sign in as admin'}
        </button>
        {login.isError ? (
          <p className="mt-3 text-sm font-bold text-red-600">Login failed. Check backend env.</p>
        ) : null}
      </section>
    </main>
  );
}
