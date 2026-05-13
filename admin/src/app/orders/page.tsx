'use client';

import { useQuery } from '@tanstack/react-query';
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

  return (
    <>
      <PageHeader description={`${activeOrders} активных заказов под наблюдением.`} title="Заказы" />
      <section className="mb-4 rounded-lg border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-sm font-bold">
            Статус заказа
            <select className="rounded-md border border-line bg-transparent p-2" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">Все</option>
              <option value="SEARCHING">SEARCHING</option>
              <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED</option>
              <option value="DRIVER_ARRIVED">DRIVER_ARRIVED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Matching
            <select className="rounded-md border border-line bg-transparent p-2" onChange={(event) => setMatchingFilter(event.target.value as MatchingFilter)} value={matchingFilter}>
              <option value="all">Все</option>
              <option value="pending">Есть pending offer</option>
              <option value="no-drivers">Нет водителей</option>
              <option value="accepted">Водитель назначен</option>
              <option value="stuck">Завис в поиске</option>
            </select>
          </label>
          <button className="self-end rounded-md border border-line px-4 py-2 font-bold" disabled={orders.isFetching} onClick={() => void orders.refetch()} type="button">
            {orders.isFetching ? 'Обновляем...' : 'Обновить'}
          </button>
        </div>
      </section>

      {orders.isError ? <p className="rounded-lg border border-line bg-surface p-4 font-bold text-red-600">Не удалось загрузить заказы.</p> : null}

      <section className="rounded-lg border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase text-muted dark:bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 font-black">ID</th>
                <th className="px-4 py-3 font-black">Статус</th>
                <th className="px-4 py-3 font-black">Пассажир</th>
                <th className="px-4 py-3 font-black">Водитель</th>
                <th className="px-4 py-3 font-black">Тариф</th>
                <th className="px-4 py-3 font-black">Matching</th>
                <th className="px-4 py-3 font-black">Стоимость</th>
                <th className="px-4 py-3 font-black">Маршрут</th>
                <th className="px-4 py-3 font-black">Создан</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr className="cursor-pointer border-t border-line hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" key={order.id} onClick={() => setSelectedOrder(order)}>
                  <td className="whitespace-nowrap px-4 py-3 font-black">{shortId(order.id)}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge label={order.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatPerson(order.passenger?.user)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatPerson(order.driver?.user)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{order.tariff?.code ?? order.tariff?.name ?? '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3"><MatchingBadge order={order} /></td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatMoney(order.fareCents ?? 0, order.currency)}</td>
                  <td className="min-w-72 px-4 py-3 font-semibold">
                    <p>{order.pickupAddress}</p>
                    <p className="text-muted">{order.dropoffAddress}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {!filteredOrders.length ? (
                <tr>
                  <td className="px-4 py-8 text-center font-bold text-muted" colSpan={9}>Заказов по выбранным фильтрам нет.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrder ? <OrderDetailsModal onClose={() => setSelectedOrder(null)} order={selectedOrder} /> : null}
    </>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const offers = useQuery({
    queryKey: ['order-offers', order.id],
    queryFn: () => fetchOrderOffers(order.id),
  });
  const orderOffers = offers.data ?? order.offers ?? null;

  return (
    <div className="modal-backdrop">
      <section className="modal max-h-[90vh] max-w-4xl overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2>Заказ {shortId(order.id)}</h2>
            <p className="text-sm font-bold text-muted">
              {order.pickupAddress} {'->'} {order.dropoffAddress}
            </p>
          </div>
          <button onClick={onClose} type="button">Закрыть</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Статус" value={order.status} />
          <Info label="Matching" value={getMatchingStatus(order).label} />
          <Info label="Пассажир" value={formatPerson(order.passenger?.user)} />
          <Info label="Водитель" value={formatPerson(order.driver?.user)} />
          <Info label="Тариф" value={order.tariff?.code ?? order.tariff?.name ?? '-'} />
          <Info label="Стоимость" value={formatMoney(order.fareCents ?? 0, order.currency)} />
          <Info label="Подача" value={order.pickupAddress} />
          <Info label="Назначение" value={order.dropoffAddress} />
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {[
            ['createdAt', order.createdAt],
            ['acceptedAt', order.acceptedAt],
            ['arrivedAt', order.arrivedAt],
            ['startedAt', order.startedAt],
            ['completedAt', order.completedAt],
            ['canceledAt', order.canceledAt],
          ].map(([label, value]) => (
            <Info key={label ?? ''} label={label ?? ''} value={formatDate(value || undefined)} />
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-black">Matching offers</h3>
          {offers.isLoading ? <p className="font-bold text-muted">Загружаем историю предложений...</p> : null}
          {orderOffers === null ? (
            <p className="rounded-md border border-line p-3 font-bold text-muted">История предложений пока недоступна.</p>
          ) : orderOffers.length ? (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/[0.03] text-xs uppercase text-muted dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-3 py-2">Водитель</th>
                    <th className="px-3 py-2">Авто</th>
                    <th className="px-3 py-2">Статус</th>
                    <th className="px-3 py-2">Отправлен</th>
                    <th className="px-3 py-2">Истекает</th>
                    <th className="px-3 py-2">Ответ</th>
                    <th className="px-3 py-2">До подачи</th>
                  </tr>
                </thead>
                <tbody>
                  {orderOffers.map((offer) => (
                    <tr className="border-t border-line" key={offer.id}>
                      <td className="px-3 py-2 font-semibold">{formatPerson(offer.driver?.user) || shortId(offer.driverId)}</td>
                      <td className="px-3 py-2 font-semibold">{formatVehicle(offer.driver)}</td>
                      <td className="px-3 py-2"><OfferBadge status={offer.status} /></td>
                      <td className="px-3 py-2 font-semibold">{formatDate(offer.offeredAt)}</td>
                      <td className="px-3 py-2 font-semibold">{formatDate(offer.expiresAt)}</td>
                      <td className="px-3 py-2 font-semibold">{formatDate(offer.respondedAt ?? undefined)}</td>
                      <td className="px-3 py-2 font-semibold">{offer.distanceToPickupKm ? `${offer.distanceToPickupKm.toFixed(1)} км` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-md border border-line p-3 font-bold text-muted">Предложений по заказу пока нет.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-bold">{value || '-'}</p>
    </div>
  );
}

function MatchingBadge({ order }: { order: Order }) {
  const matching = getMatchingStatus(order);
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${matching.className}`}>{matching.label}</span>;
}

function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-black dark:bg-white/10">{label}</span>;
}

function OfferBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    PENDING: 'Ожидает ответа',
    ACCEPTED: 'Принят',
    REJECTED: 'Отклонен',
    EXPIRED: 'Истек',
    CANCELED: 'Отменен',
  };
  return <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-black dark:bg-white/10">{labels[status] ?? status}</span>;
}

function getMatchingStatus(order: Order): { kind: MatchingFilter | 'unknown'; label: string; className: string } {
  const offers = order.offers ?? [];
  if (order.status === 'DRIVER_ASSIGNED') {
    return { kind: 'accepted', label: 'Водитель назначен', className: 'bg-emerald-100 text-emerald-800' };
  }
  if (order.status === 'SEARCHING' && offers.some((offer) => offer.status === 'PENDING')) {
    return { kind: 'pending', label: 'Ожидает ответа водителя', className: 'bg-blue-100 text-blue-800' };
  }
  if (
    order.status === 'SEARCHING' &&
    offers.length > 0 &&
    offers.every((offer) => ['REJECTED', 'EXPIRED', 'CANCELED'].includes(offer.status))
  ) {
    return { kind: 'no-drivers', label: 'Нет доступных водителей', className: 'bg-amber-100 text-amber-800' };
  }
  if (order.status === 'SEARCHING' && !offers.length) {
    return { kind: 'stuck', label: 'Поиск не запускался / нет данных', className: 'bg-slate-100 text-slate-800' };
  }
  return { kind: 'unknown', label: 'Нет данных', className: 'bg-slate-100 text-slate-800' };
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
