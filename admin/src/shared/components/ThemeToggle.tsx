'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const t = useTranslations('app');

  useEffect(() => {
    const stored = localStorage.getItem('admin.theme');
    const enabled = stored === 'dark';
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('admin.theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <button
      aria-label={t('themeToggle')}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-text"
      onClick={toggle}
      type="button"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
