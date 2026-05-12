'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '../../components/Ui';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+998900000001');
  const { devLogin, isLoading, error } = useAuthStore();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await devLogin(phone);
    if (ok) router.replace('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Taxi Admin</h1>
              <p className="mt-1 text-sm text-slate-500">Dev-login администратора для MVP.</p>
            </div>
            <label className="block space-y-1 text-sm font-bold text-slate-700">
              <span>Телефон</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            {error ? <div className="rounded-md bg-rose-100 p-3 text-sm font-bold text-rose-800">{error}</div> : null}
            <Button type="submit">{isLoading ? 'Входим...' : 'Войти'}</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
