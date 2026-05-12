'use client';

import { useQuery } from '@tanstack/react-query';
import { adminDriversApi } from '../../api/drivers';
import { adminOrdersApi } from '../../api/orders';
import { Card, StateMessage } from '../../components/Ui';
import { Driver, Order } from '../../types/api';

export function DashboardView() {
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: () => adminOrdersApi.getAll() });
  const drivers = useQuery({ queryKey: ['admin-drivers'], queryFn: () => adminDriversApi.getAll() });

  if (orders.isLoading || drivers.isLoading) {
    return <StateMessage title="Загружаем статистику..." />;
  }

  const orderItems = orders.data ?? [];
  const driverItems = drivers.data ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Metric title="Всего заказов" value={orderItems.length} />
      <Metric title="Активные заказы" value={countActiveOrders(orderItems)} />
      <Metric title="Онлайн-водители" value={driverItems.filter((driver) => driver.status === 'ONLINE').length} />
      <Metric title="Завершенные поездки" value={orderItems.filter((order) => order.status === 'COMPLETED').length} />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <div className="text-sm font-bold text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
    </Card>
  );
}

function countActiveOrders(orders: Order[]) {
  return orders.filter((order) => ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(order.status)).length;
}
