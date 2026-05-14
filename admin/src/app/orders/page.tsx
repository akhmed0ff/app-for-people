'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Descriptions, Empty, Modal, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { AntCard } from '../../shared/components/AntCard';
import { fetchAdminOrders, fetchOrderOffers } from '../../shared/api/admin-api';
import { Order, OrderOffer } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

type MatchingFilter = 'all' | 'pending' | 'no-drivers' | 'accepted' | 'stuck';
type MatchingKind = 'pending' | 'noDrivers' | 'accepted' | 'stuck' | 'unknown';

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchingFilter, setMatchingFilter] = useState<MatchingFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const tOrderStatus = useTranslations('statuses.orders');
  const orders = useQuery({ queryKey: ['orders'], queryFn: fetchAdminOrders, refetchInterval: 10000 });

  const filteredOrders = useMemo(
    () =>
      (orders.data ?? []).filter((order) => {
        const statusMatches = statusFilter === 'all' || order.status === statusFilter;
        const matching = getMatchingStatus(order);
        const matchingMatches =
          matchingFilter === 'all' ||
          (matchingFilter === 'pending' && matching.kind === 'pending') ||
          (matchingFilter === 'no-drivers' && matching.kind === 'noDrivers') ||
          (matchingFilter === 'accepted' && matching.kind === 'accepted') ||
          (matchingFilter === 'stuck' && matching.kind === 'stuck');
        return statusMatches && matchingMatches;
      }),
    [matchingFilter, orders.data, statusFilter],
  );

  const activeOrders = (orders.data ?? []).filter((order) => !['COMPLETED', 'CANCELED'].includes(order.status)).length;

  const columns: ColumnsType<Order> = [
    { title: t('id'), dataIndex: 'id', render: (id: string) => <Typography.Text strong>{shortId(id)}</Typography.Text> },
    { title: tCommon('status'), dataIndex: 'status', render: (status: string) => <StatusTag status={status} /> },
    { title: t('passenger'), render: (_, order) => formatPerson(order.passenger?.user) },
    { title: t('driver'), render: (_, order) => formatPerson(order.driver?.user) },
    { title: t('tariff'), render: (_, order) => order.tariff?.code ?? order.tariff?.name ?? '-' },
    { title: t('matching'), render: (_, order) => <MatchingTag order={order} /> },
    { title: t('price'), render: (_, order) => formatMoney(order.fareCents ?? 0, order.currency) },
    {
      title: t('route'),
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{order.pickupAddress}</Typography.Text>
          <Typography.Text type="secondary">{order.dropoffAddress}</Typography.Text>
        </Space>
      ),
    },
    { title: tCommon('created'), dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
  ];

  return (
    <>
      <PageHeader description={t('description', { count: activeOrders })} title={t('title')} />
      <AntCard style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('allStatuses') },
              { value: 'SEARCHING', label: tOrderStatus('SEARCHING') },
              { value: 'DRIVER_ASSIGNED', label: tOrderStatus('DRIVER_ASSIGNED') },
              { value: 'DRIVER_ARRIVED', label: tOrderStatus('DRIVER_ARRIVED') },
              { value: 'IN_PROGRESS', label: tOrderStatus('IN_PROGRESS') },
              { value: 'COMPLETED', label: tOrderStatus('COMPLETED') },
              { value: 'CANCELED', label: tOrderStatus('CANCELED') },
            ]}
            style={{ minWidth: 220 }}
            value={statusFilter}
          />
          <Select
            onChange={(value: MatchingFilter) => setMatchingFilter(value)}
            options={[
              { value: 'all', label: t('allMatchingStatuses') },
              { value: 'pending', label: t('hasPendingOffer') },
              { value: 'no-drivers', label: t('noDrivers') },
              { value: 'accepted', label: t('accepted') },
              { value: 'stuck', label: t('stuck') },
            ]}
            style={{ minWidth: 240 }}
            value={matchingFilter}
          />
          <Button icon={<ReloadOutlined />} loading={orders.isFetching} onClick={() => void orders.refetch()}>
            {tCommon('refresh')}
          </Button>
        </Space>
      </AntCard>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        loading={orders.isLoading}
        locale={{ emptyText: orders.isError ? t('loadFailed') : t('emptyFiltered') }}
        onRow={(order: Order) => ({ onClick: () => setSelectedOrder(order) })}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <OrderDetailsModal onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const offers = useQuery({
    enabled: Boolean(order),
    queryKey: ['order-offers', order?.id],
    queryFn: () => fetchOrderOffers(order!.id),
  });
  const orderOffers = offers.data ?? order?.offers ?? null;
  const offerColumns = useOfferColumns();

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={Boolean(order)}
      title={order ? t('orderTitle', { id: shortId(order.id) }) : ''}
      width={980}
    >
      {order ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions bordered column={{ md: 2, xs: 1 }} size="small">
            <Descriptions.Item label={tCommon('status')}>
              <StatusTag status={order.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('matching')}>
              <MatchingTag order={order} />
            </Descriptions.Item>
            <Descriptions.Item label={t('passenger')}>{formatPerson(order.passenger?.user)}</Descriptions.Item>
            <Descriptions.Item label={t('driver')}>{formatPerson(order.driver?.user)}</Descriptions.Item>
            <Descriptions.Item label={t('tariff')}>{order.tariff?.code ?? order.tariff?.name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label={t('price')}>{formatMoney(order.fareCents ?? 0, order.currency)}</Descriptions.Item>
            <Descriptions.Item label={t('pickup')}>{order.pickupAddress}</Descriptions.Item>
            <Descriptions.Item label={t('destination')}>{order.dropoffAddress}</Descriptions.Item>
            <Descriptions.Item label={tCommon('created')}>{formatDate(order.createdAt)}</Descriptions.Item>
            <Descriptions.Item label={t('acceptedAt')}>{formatDate(order.acceptedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label={t('arrivedAt')}>{formatDate(order.arrivedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label={t('startedAt')}>{formatDate(order.startedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label={t('completedAt')}>{formatDate(order.completedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label={t('canceledAt')}>{formatDate(order.canceledAt ?? undefined)}</Descriptions.Item>
          </Descriptions>

          <AntCard title={t('matchingOffers')}>
            {offers.isLoading ? <Spin /> : null}
            {orderOffers === null ? (
              <Empty description={t('offersUnavailable')} />
            ) : orderOffers.length ? (
              <Table
                columns={offerColumns}
                dataSource={orderOffers}
                pagination={false}
                rowKey="id"
                scroll={{ x: 900 }}
                size="small"
              />
            ) : (
              <Empty description={t('offersEmpty')} />
            )}
          </AntCard>
        </Space>
      ) : null}
    </Modal>
  );
}

function useOfferColumns(): ColumnsType<OrderOffer> {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  return [
    { title: t('driver'), render: (_, offer) => formatPerson(offer.driver?.user) || shortId(offer.driverId) },
    { title: t('vehicle'), render: (_, offer) => formatVehicle(offer.driver) },
    { title: tCommon('status'), dataIndex: 'status', render: (status: string) => <OfferTag status={status} /> },
    { title: t('offered'), dataIndex: 'offeredAt', render: (value: string) => formatDate(value) },
    { title: t('expires'), dataIndex: 'expiresAt', render: (value: string) => formatDate(value) },
    { title: t('responded'), dataIndex: 'respondedAt', render: (value?: string | null) => formatDate(value ?? undefined) },
    {
      title: t('toPickup'),
      dataIndex: 'distanceToPickupKm',
      render: (value?: number) => (value ? t('km', { value: value.toFixed(1) }) : '-'),
    },
  ];
}

function MatchingTag({ order }: { order: Order }) {
  const t = useTranslations('orders.matchingStatus');
  const matching = getMatchingStatus(order);
  return <Tag color={matching.color}>{t(matching.kind)}</Tag>;
}

function StatusTag({ status }: { status: string }) {
  const t = useTranslations('statuses.orders');
  return <Tag color={statusColor(status)}>{t(status)}</Tag>;
}

function OfferTag({ status }: { status: string }) {
  const t = useTranslations('statuses.offers');
  return <Tag color={offerColor(status)}>{t(status)}</Tag>;
}

function getMatchingStatus(order: Order): { kind: MatchingKind; color: string } {
  const offers = order.offers ?? [];
  if (order.status === 'DRIVER_ASSIGNED') {
    return { kind: 'accepted', color: 'green' };
  }
  if (order.status === 'SEARCHING' && offers.some((offer) => offer.status === 'PENDING')) {
    return { kind: 'pending', color: 'blue' };
  }
  if (
    order.status === 'SEARCHING' &&
    offers.length > 0 &&
    offers.every((offer) => ['REJECTED', 'EXPIRED', 'CANCELED'].includes(offer.status))
  ) {
    return { kind: 'noDrivers', color: 'gold' };
  }
  if (order.status === 'SEARCHING' && !offers.length) {
    return { kind: 'stuck', color: 'default' };
  }
  return { kind: 'unknown', color: 'default' };
}

function statusColor(status: string) {
  if (status === 'COMPLETED') return 'green';
  if (status === 'CANCELED') return 'red';
  if (status === 'SEARCHING') return 'blue';
  return 'gold';
}

function offerColor(status: string) {
  if (status === 'ACCEPTED') return 'green';
  if (status === 'REJECTED') return 'red';
  if (status === 'EXPIRED') return 'orange';
  if (status === 'PENDING') return 'blue';
  return 'default';
}

function formatPerson(user?: { firstName?: string; lastName?: string } | null) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '-';
}

function formatVehicle(driver?: { vehicleMake?: string; vehicleModel?: string; vehiclePlate?: string } | null) {
  const model = [driver?.vehicleMake, driver?.vehicleModel].filter(Boolean).join(' ');
  return [model, driver?.vehiclePlate].filter(Boolean).join(' / ') || '-';
}

function shortId(id?: string) {
  return id ? id.slice(0, 8) : '-';
}
