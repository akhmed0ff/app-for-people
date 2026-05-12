'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/orders', label: 'Заказы' },
  { href: '/drivers', label: 'Водители' },
  { href: '/tariffs', label: 'Тарифы' },
  { href: '/settings', label: 'Настройки' },
];

export function ProtectedLayout({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, isRestoring, restore, logout } = useAuthStore();

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (!isRestoring && !accessToken) {
      router.replace('/login');
    }
  }, [accessToken, isRestoring, router]);

  if (isRestoring || !accessToken) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Загружаем админку...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <div className="text-xl font-black text-slate-950">Taxi Admin</div>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-bold ${
                pathname === item.href ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-8">
          <div>
            <h1 className="text-xl font-black text-slate-950">{title}</h1>
            <p className="text-sm text-slate-500">{user?.phone}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
          >
            Выйти
          </button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
