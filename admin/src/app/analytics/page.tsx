'use client';

import { useQuery } from '@tanstack/react-query';
import { Col, Empty, Row, Tooltip } from 'antd';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { AntCard } from '../../shared/components/AntCard';
import { fetchDrivers, fetchOrders, fetchPayments } from '../../shared/api/admin-api';
import { Payment } from '../../shared/api/types';
import { MetricCard } from '../../shared/components/MetricCard';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

// Build last-N-days revenue buckets from payments data.
// Each bucket is one calendar day in the local timezone.
function buildRevenueTrend(payments: Payment[], days = 7): { label: string; amountCents: number }[] {
  const now = new Date();
  const buckets: { label: string; amountCents: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    buckets.push({ label: key, amountCents: 0 });
  }

  const successPayments = payments.filter((p) => p.status === 'SUCCESS');

  for (const payment of successPayments) {
    const created = new Date(payment.createdAt);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < days) {
      // bucket index: most-recent day is last bucket
      const idx = days - 1 - diffDays;
      buckets[idx].amountCents += payment.amountCents;
    }
  }

  return buckets;
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
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

  const trend = useMemo(
    () => buildRevenueTrend(payments.data ?? [], 7),
    [payments.data],
  );

  const maxAmount = Math.max(...trend.map((b) => b.amountCents), 1);
  const hasAnyRevenue = trend.some((b) => b.amountCents > 0);

  return (
    <>
      <PageHeader description={t('description')} title={t('title')} />
      <Row gutter={[16, 16]}>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label={t('grossRevenue')} value={formatMoney(revenue)} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label={t('completedOrders')} value={completed} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label={t('canceledOrders')} value={canceled} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label={t('onlineDrivers')} value={onlineDrivers} />
        </Col>
      </Row>

      <AntCard style={{ marginTop: 24 }} title={t('revenueTrend')}>
        {payments.isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            {t('loading')}
          </div>
        ) : !hasAnyRevenue ? (
          <div className="flex h-64 items-center justify-center">
            <Empty description={t('noRevenueData')} />
          </div>
        ) : (
          <div className="flex h-64 items-end gap-3 px-2">
            {trend.map((bucket) => {
              const heightPct = maxAmount > 0 ? (bucket.amountCents / maxAmount) * 100 : 0;
              // Minimum visible bar height so zero-days still render as a sliver
              const displayPct = bucket.amountCents > 0 ? Math.max(heightPct, 4) : 2;
              return (
                <Tooltip
                  key={bucket.label}
                  title={`${bucket.label}: ${formatMoney(bucket.amountCents)}`}
                >
                  <div className="flex flex-1 cursor-pointer flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-teal-600 transition-all duration-300 hover:bg-teal-500"
                      style={{ height: `${displayPct}%` }}
                    />
                    <span className="text-xs font-bold text-slate-500">{bucket.label}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </AntCard>
    </>
  );
}
