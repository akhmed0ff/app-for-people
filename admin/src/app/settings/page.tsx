'use client';

import { PageHeader } from '../../shared/components/PageHeader';

export default function SettingsPage() {
  return (
    <>
      <PageHeader description="Operational defaults and security preferences." title="Settings" />
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="text-lg font-black">Dispatch</h3>
          <label className="mt-4 block text-sm font-bold text-muted">
            Default search radius
            <input
              className="mt-1 h-10 w-full rounded-lg border border-line bg-transparent px-3 text-text outline-none"
              defaultValue="5000"
              type="number"
            />
          </label>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="text-lg font-black">Security</h3>
          <label className="mt-4 flex items-center justify-between gap-3 text-sm font-bold">
            Require strong admin sessions
            <input className="h-5 w-5" defaultChecked type="checkbox" />
          </label>
        </div>
      </section>
    </>
  );
}
