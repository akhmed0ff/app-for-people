'use client';

import { CarOutlined, DollarOutlined, FieldTimeOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Col, List, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { AntCard } from '../shared/components/AntCard';
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
  const searchingOrders = orders.data?.filter((order) => order.status === 'SEARCHING').length ?? 0;
  const offers = orders.data?.flatMap((order) => order.offers ?? []) ?? [];
  const hasOffersData = (orders.data ?? []).some((order) => Array.isArray(order.offers));
  const today = new Date().toDateString();
  const pendingOffers = hasOffersData ? offers.filter((offer) => offer.status === 'PENDING').length : 'Нет данных';
  const rejectedToday = hasOffersData
    ? offers.filter((offer) => offer.status === 'REJECTED' && new Date(offer.updatedAt).toDateString() === today).length
    : 'Нет данных';
  const expiredToday = hasOffersData
    ? offers.filter((offer) => offer.status === 'EXPIRED' && new Date(offer.updatedAt).toDateString() === today).length
    : 'Нет данных';
  const noDriverOrders = hasOffersData
    ? (orders.data ?? []).filter(
        (order) =>
          order.status === 'SEARCHING' &&
          (order.offers?.length ?? 0) > 0 &&
          order.offers?.every((offer) => ['REJECTED', 'EXPIRED', 'CANCELED'].includes(offer.status)),
      ).length
    : 'Нет данных';
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
      <Row gutter={[16, 16]}>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Users" value={dashboard.data?.users ?? 0} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Active drivers" value={activeDrivers} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Open orders" value={openOrders} />
        </Col>
        <Col lg={6} sm={12} xs={24}>
          <MetricCard label="Revenue" value={formatMoney(revenue)} />
        </Col>
        <Col lg={5} sm={12} xs={24}>
          <MetricCard label="Заказы в поиске" value={searchingOrders} />
        </Col>
        <Col lg={5} sm={12} xs={24}>
          <MetricCard label="Offers pending" value={pendingOffers} />
        </Col>
        <Col lg={5} sm={12} xs={24}>
          <MetricCard label="Offers rejected today" value={rejectedToday} />
        </Col>
        <Col lg={5} sm={12} xs={24}>
          <MetricCard label="Offers expired today" value={expiredToday} />
        </Col>
        <Col lg={4} sm={12} xs={24}>
          <MetricCard label="Без водителя" value={noDriverOrders} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col lg={14} xs={24}>
          <AntCard title="Order Monitoring">
            {orders.isLoading ? (
              <Skeleton active />
            ) : (
              <List
                dataSource={(orders.data ?? []).slice(0, 6)}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      description={
                        <Space direction="vertical" size={2}>
                          <Typography.Text type="secondary">{order.pickupAddress}</Typography.Text>
                          <Typography.Text type="secondary">{order.dropoffAddress}</Typography.Text>
                        </Space>
                      }
                      title={
                        <Space>
                          <Tag color={statusColor(order.status)}>{order.status}</Tag>
                          <Typography.Text strong>{order.tariff?.code ?? order.currency}</Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </AntCard>
        </Col>
        <Col lg={10} xs={24}>
          <AntCard title="Operations Snapshot">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Snapshot icon={<CarOutlined />} label="Online drivers" value={activeDrivers} />
              <Snapshot icon={<SearchOutlined />} label="Searching orders" value={searchingOrders} />
              <Snapshot icon={<FieldTimeOutlined />} label="Pending offers" value={pendingOffers} />
              <Snapshot icon={<DollarOutlined />} label="Successful revenue" value={formatMoney(revenue)} />
            </Space>
          </AntCard>
        </Col>
      </Row>
    </>
  );
}

function Snapshot({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <AntCard size="small">
      <Space>
        {icon}
        <Typography.Text type="secondary">{label}</Typography.Text>
        <Typography.Text strong>{value}</Typography.Text>
      </Space>
    </AntCard>
  );
}

function statusColor(status: string) {
  if (status === 'COMPLETED') return 'green';
  if (status === 'CANCELED') return 'red';
  if (status === 'SEARCHING') return 'blue';
  return 'gold';
}
