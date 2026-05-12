'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDrivers, fetchOrders, fetchPayments } from '../../shared/api/admin-api';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

export default function AnalyticsPage() {
  const orders = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });
  const drivers = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
  const payments = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });

  const completed = orders.data?.filter((order) => order.status === 'COMPLETED').length ?? 0;
  const canceled = orders.data?.filter((order) => order.status === 'CANCELED').length ?? 0;
  const revenue =
    payments.data
      ?.filter((payment) => payment.status === 'SUCCESS')
      .reduce((sum, payment) => sum + payment.amountCents, 0) ?? 0;
  const onlineDrivers = drivers.data?.filter((driver) => driver.status === 'ONLINE').length ?? 0;

  return (
    <>
      <PageHeader description="Financial and operational statistics." title="Analytics" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross revenue" value={formatMoney(revenue)} />
        <MetricCard label="Completed orders" value={completed} />
        <MetricCard label="Canceled orders" value={canceled} />
        <MetricCard label="Online drivers" value={onlineDrivers} />
      </div>
      <section className="mt-6 rounded-lg border border-line bg-surface p-4">
        <h3 className="mb-4 text-lg font-black">Revenue Trend</h3>
        <div className="flex h-64 items-end gap-3">
          {[44, 68, 52, 80, 61, 92, 74].map((height, index) => (
            <div className="flex flex-1 flex-col items-center gap-2" key={height + index}>
              <div className="w-full rounded-t-lg bg-brand" style={{ height: `${height}%` }} />
              <span className="text-xs font-bold text-muted">D{index + 1}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
