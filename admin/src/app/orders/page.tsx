'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../shared/api/admin-api';
import { Order } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'pickupAddress', header: 'Pickup' },
  { accessorKey: 'dropoffAddress', header: 'Dropoff' },
  {
    header: 'Driver',
    cell: ({ row }) => row.original.driver?.user.firstName ?? '-',
  },
  {
    header: 'Fare',
    cell: ({ row }) => formatMoney(row.original.fareCents ?? 0, row.original.currency),
  },
  { accessorFn: (row) => formatDate(row.createdAt), header: 'Created' },
];

export default function OrdersPage() {
  const orders = useQuery({ queryKey: ['orders'], queryFn: fetchOrders, refetchInterval: 10000 });
  const open = orders.data?.filter((order) => !['COMPLETED', 'CANCELED'].includes(order.status)).length ?? 0;

  return (
    <>
      <PageHeader description={`${open} active orders currently monitored.`} title="Orders" />
      <DataTable columns={columns} data={orders.data ?? []} searchPlaceholder="Search orders" />
    </>
  );
}
