import { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">{children}</div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'green' | 'red' | 'blue' | 'neutral' }) {
  const colors = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    blue: 'bg-blue-100 text-blue-800',
    neutral: 'bg-slate-100 text-slate-700',
  };

  return <span className={`rounded px-2 py-1 text-xs font-black ${colors[tone]}`}>{children}</span>;
}

export function StateMessage({ title }: { title: string }) {
  return <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">{title}</div>;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const colors = {
    primary: 'bg-slate-950 text-white',
    secondary: 'bg-blue-600 text-white',
    danger: 'bg-rose-600 text-white',
  };

  return (
    <button type={type} onClick={onClick} className={`rounded-md px-3 py-2 text-sm font-bold ${colors[variant]}`}>
      {children}
    </button>
  );
}
