'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Empty,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AntCard } from '../../shared/components/AntCard';
import { useMemo, useState } from 'react';
import { fetchAdminOrders, fetchOrderOffers } from '../../shared/api/admin-api';
import { Order, OrderOffer } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

type MatchingFilter = 'all' | 'pending' | 'no-drivers' | 'accepted' | 'stuck';

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchingFilter, setMatchingFilter] = useState<MatchingFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const orders = useQuery({ queryKey: ['orders'], queryFn: fetchAdminOrders, refetchInterval: 10000 });

  const filteredOrders = useMemo(
    () =>
      (orders.data ?? []).filter((order) => {
        const statusMatches = statusFilter === 'all' || order.status === statusFilter;
        const matching = getMatchingStatus(order);
        const matchingMatches =
          matchingFilter === 'all' ||
          (matchingFilter === 'pending' && matching.kind === 'pending') ||
          (matchingFilter === 'no-drivers' && matching.kind === 'no-drivers') ||
          (matchingFilter === 'accepted' && matching.kind === 'accepted') ||
          (matchingFilter === 'stuck' && matching.kind === 'stuck');
        return statusMatches && matchingMatches;
      }),
    [matchingFilter, orders.data, statusFilter],
  );

  const activeOrders = (orders.data ?? []).filter((order) => !['COMPLETED', 'CANCELED'].includes(order.status)).length;

  const columns: ColumnsType<Order> = [
    { title: 'ID', dataIndex: 'id', render: (id: string) => <Typography.Text strong>{shortId(id)}</Typography.Text> },
    { title: 'Status', dataIndex: 'status', render: (status: string) => <StatusTag status={status} /> },
    { title: 'Passenger', render: (_, order) => formatPerson(order.passenger?.user) },
    { title: 'Driver', render: (_, order) => formatPerson(order.driver?.user) },
    { title: 'Tariff', render: (_, order) => order.tariff?.code ?? order.tariff?.name ?? '-' },
    { title: 'Matching', render: (_, order) => <MatchingTag order={order} /> },
    { title: 'Price', render: (_, order) => formatMoney(order.fareCents ?? 0, order.currency) },
    {
      title: 'Route',
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{order.pickupAddress}</Typography.Text>
          <Typography.Text type="secondary">{order.dropoffAddress}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Created', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
  ];

  return (
    <>
      <PageHeader description={`${activeOrders} активных заказов под наблюдением.`} title="Orders" />
      <AntCard style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'SEARCHING', label: 'SEARCHING' },
              { value: 'DRIVER_ASSIGNED', label: 'DRIVER_ASSIGNED' },
              { value: 'DRIVER_ARRIVED', label: 'DRIVER_ARRIVED' },
              { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
              { value: 'COMPLETED', label: 'COMPLETED' },
              { value: 'CANCELED', label: 'CANCELED' },
            ]}
            style={{ minWidth: 220 }}
            value={statusFilter}
          />
          <Select
            onChange={(value: MatchingFilter) => setMatchingFilter(value)}
            options={[
              { value: 'all', label: 'Все matching статусы' },
              { value: 'pending', label: 'Есть pending offer' },
              { value: 'no-drivers', label: 'Нет водителей' },
              { value: 'accepted', label: 'Водитель назначен' },
              { value: 'stuck', label: 'Завис в поиске' },
            ]}
            style={{ minWidth: 240 }}
            value={matchingFilter}
          />
          <Button icon={<ReloadOutlined />} loading={orders.isFetching} onClick={() => void orders.refetch()}>
            Обновить
          </Button>
        </Space>
      </AntCard>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        loading={orders.isLoading}
        locale={{ emptyText: orders.isError ? 'Не удалось загрузить заказы' : 'Заказов по фильтрам нет' }}
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
  const offers = useQuery({
    enabled: Boolean(order),
    queryKey: ['order-offers', order?.id],
    queryFn: () => fetchOrderOffers(order!.id),
  });
  const orderOffers = offers.data ?? order?.offers ?? null;

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={Boolean(order)}
      title={order ? `Заказ ${shortId(order.id)}` : ''}
      width={980}
    >
      {order ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions bordered column={{ md: 2, xs: 1 }} size="small">
            <Descriptions.Item label="Status">{order.status}</Descriptions.Item>
            <Descriptions.Item label="Matching">{getMatchingStatus(order).label}</Descriptions.Item>
            <Descriptions.Item label="Passenger">{formatPerson(order.passenger?.user)}</Descriptions.Item>
            <Descriptions.Item label="Driver">{formatPerson(order.driver?.user)}</Descriptions.Item>
            <Descriptions.Item label="Tariff">{order.tariff?.code ?? order.tariff?.name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Price">{formatMoney(order.fareCents ?? 0, order.currency)}</Descriptions.Item>
            <Descriptions.Item label="Pickup">{order.pickupAddress}</Descriptions.Item>
            <Descriptions.Item label="Destination">{order.dropoffAddress}</Descriptions.Item>
            <Descriptions.Item label="Created">{formatDate(order.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Accepted">{formatDate(order.acceptedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label="Arrived">{formatDate(order.arrivedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label="Started">{formatDate(order.startedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label="Completed">{formatDate(order.completedAt ?? undefined)}</Descriptions.Item>
            <Descriptions.Item label="Canceled">{formatDate(order.canceledAt ?? undefined)}</Descriptions.Item>
          </Descriptions>

          <AntCard title="Matching offers">
            {offers.isLoading ? <Spin /> : null}
            {orderOffers === null ? (
              <Empty description="История предложений пока недоступна" />
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
              <Empty description="Предложений по заказу пока нет" />
            )}
          </AntCard>
        </Space>
      ) : null}
    </Modal>
  );
}

const offerColumns: ColumnsType<OrderOffer> = [
  { title: 'Driver', render: (_, offer) => formatPerson(offer.driver?.user) || shortId(offer.driverId) },
  { title: 'Vehicle', render: (_, offer) => formatVehicle(offer.driver) },
  { title: 'Status', dataIndex: 'status', render: (status: string) => <OfferTag status={status} /> },
  { title: 'Offered', dataIndex: 'offeredAt', render: (value: string) => formatDate(value) },
  { title: 'Expires', dataIndex: 'expiresAt', render: (value: string) => formatDate(value) },
  { title: 'Responded', dataIndex: 'respondedAt', render: (value?: string | null) => formatDate(value ?? undefined) },
  {
    title: 'To pickup',
    dataIndex: 'distanceToPickupKm',
    render: (value?: number) => (value ? `${value.toFixed(1)} км` : '-'),
  },
];

function MatchingTag({ order }: { order: Order }) {
  const matching = getMatchingStatus(order);
  return <Tag color={matching.color}>{matching.label}</Tag>;
}

function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColor(status)}>{status}</Tag>;
}

function OfferTag({ status }: { status: string }) {
  const labels: Record<string, string> = {
    PENDING: 'Ожидает ответа',
    ACCEPTED: 'Принят',
    REJECTED: 'Отклонен',
    EXPIRED: 'Истек',
    CANCELED: 'Отменен',
  };
  return <Tag color={offerColor(status)}>{labels[status] ?? status}</Tag>;
}

function getMatchingStatus(order: Order): { kind: MatchingFilter | 'unknown'; label: string; color: string } {
  const offers = order.offers ?? [];
  if (order.status === 'DRIVER_ASSIGNED') {
    return { kind: 'accepted', label: 'Водитель назначен', color: 'green' };
  }
  if (order.status === 'SEARCHING' && offers.some((offer) => offer.status === 'PENDING')) {
    return { kind: 'pending', label: 'Ожидает ответа водителя', color: 'blue' };
  }
  if (
    order.status === 'SEARCHING' &&
    offers.length > 0 &&
    offers.every((offer) => ['REJECTED', 'EXPIRED', 'CANCELED'].includes(offer.status))
  ) {
    return { kind: 'no-drivers', label: 'Нет доступных водителей', color: 'gold' };
  }
  if (order.status === 'SEARCHING' && !offers.length) {
    return { kind: 'stuck', label: 'Поиск не запускался / нет данных', color: 'default' };
  }
  return { kind: 'unknown', label: 'Нет данных', color: 'default' };
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
  return [model, driver?.vehiclePlate].filter(Boolean).join(' · ') || '-';
}

function shortId(id?: string) {
  return id ? id.slice(0, 8) : '-';
}
