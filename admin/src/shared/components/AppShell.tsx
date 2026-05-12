'use client';

import clsx from 'clsx';
import {
  BarChart3,
  Car,
  CreditCard,
  Gauge,
  MapPinned,
  Menu,
  Settings,
  Tags,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../auth/auth-store';
import { ThemeToggle } from './ThemeToggle';

const nav = [
  { href: '/', label: 'Dashboard', icon: Gauge },
  { href: '/drivers', label: 'Drivers', icon: Car },
  { href: '/passengers', label: 'Passengers', icon: Users },
  { href: '/orders', label: 'Orders', icon: MapPinned },
  { href: '/tariffs', label: 'Tariffs', icon: Tags },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen text-text">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-surface p-4 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase text-brand">Taxi Admin</p>
            <h1 className="text-xl font-black">Operations</h1>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} type="button">
            <X size={22} />
          </button>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold',
                  active ? 'bg-brand text-white' : 'text-muted hover:bg-black/5 dark:hover:bg-white/10',
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-white/85 px-4 py-3 backdrop-blur dark:bg-[#0f141b]/85">
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface lg:hidden"
              onClick={() => setOpen(true)}
              type="button"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-muted">Realtime operations console</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-bold"
                onClick={() => {
                  auth.logout();
                  router.replace('/login');
                }}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
