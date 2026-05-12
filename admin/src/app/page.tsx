'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchDrivers, fetchOrders, fetchPayments } from '../shared/api/admin-api';
import { MetricCard } from '../shared/components/MetricCard';
import { PageHeader } from '../shared/components/PageHeader';
import { formatMoney } from '../shared/utils/format';

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  const drivers = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
  const orders = useQuery({ queryKey: ['orders'], queryFn: fetchOrders, refetchInterval: 10000 });
  const payments = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });

  const activeDrivers = drivers.data?.filter((driver) => driver.status === 'ONLINE').length ?? 0;
  const openOrders =
    orders.data?.filter((order) => !['COMPLETED', 'CANCELED'].includes(order.status)).length ?? 0;
  const revenue =
    payments.data
      ?.filter((payment) => payment.status === 'SUCCESS')
      .reduce((sum, payment) => sum + payment.amountCents, 0) ?? 0;

  return (
    <>
      <PageHeader
        description="Live operational overview for dispatch, revenue, and fleet health."
        title="Dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Users" value={dashboard.data?.users ?? 0} />
        <MetricCard label="Active drivers" value={activeDrivers} />
        <MetricCard label="Open orders" value={openOrders} />
        <MetricCard label="Revenue" value={formatMoney(revenue)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-line bg-surface p-4">
          <h3 className="mb-4 text-lg font-black">Order Monitoring</h3>
          <div className="space-y-3">
            {(orders.data ?? []).slice(0, 6).map((order) => (
              <div className="rounded-lg border border-line p-3" key={order.id}>
                <div className="flex justify-between gap-3">
                  <p className="font-black">{order.status}</p>
                  <span className="text-sm font-bold text-muted">{order.currency}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-muted">{order.pickupAddress}</p>
                <p className="text-sm font-semibold text-muted">{order.dropoffAddress}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-line bg-surface p-4">
          <h3 className="mb-4 text-lg font-black">Active Drivers Map</h3>
          <div className="relative h-80 overflow-hidden rounded-lg bg-[#dfe7ea] dark:bg-[#1d2733]">
            {(drivers.data ?? []).slice(0, 8).map((driver, index) => (
              <span
                className="absolute h-3 w-3 rounded-full bg-brand ring-4 ring-brand/20"
                key={driver.id}
                style={{ left: `${18 + ((index * 17) % 68)}%`, top: `${20 + ((index * 23) % 58)}%` }}
                title={driver.vehiclePlate}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
