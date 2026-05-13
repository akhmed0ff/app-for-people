'use client';

import { useQuery } from '@tanstack/react-query';
import { Col, Row } from 'antd';
import { AntCard } from '../../shared/components/AntCard';
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
      <Row gutter={[16, 16]}>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Gross revenue" value={formatMoney(revenue)} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Completed orders" value={completed} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Canceled orders" value={canceled} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Online drivers" value={onlineDrivers} />
        </Col>
      </Row>
      <AntCard style={{ marginTop: 24 }} title="Revenue Trend">
        <div className="flex h-64 items-end gap-3">
          {[44, 68, 52, 80, 61, 92, 74].map((height, index) => (
            <div className="flex flex-1 flex-col items-center gap-2" key={height + index}>
              <div className="w-full rounded-t-lg bg-teal-600" style={{ height: `${height}%` }} />
              <span className="text-xs font-bold text-slate-500">D{index + 1}</span>
            </div>
          ))}
        </div>
      </AntCard>
    </>
  );
}
