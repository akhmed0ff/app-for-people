'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { adminOrdersApi } from '../../api/orders';
import { Badge, StateMessage } from '../../components/Ui';
import { Order, OrderStatus } from '../../types/api';

const statuses: Array<OrderStatus | ''> = ['', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];

export function OrdersView() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const query = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => adminOrdersApi.getAll(status || undefined),
  });

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      { header: 'Статус', accessorKey: 'status', cell: ({ row }) => <Badge tone="blue">{row.original.status}</Badge> },
      { header: 'Подача', accessorKey: 'pickupAddress' },
      { header: 'Назначение', accessorKey: 'destinationAddress' },
      { header: 'Passenger', accessorKey: 'passengerId' },
      { header: 'Driver', accessorKey: 'driverId' },
      { header: 'Оценка', accessorKey: 'estimatedPrice' },
      { header: 'Финал', accessorKey: 'finalPrice' },
      { header: 'Создан', accessorKey: 'createdAt', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('ru-RU') },
    ],
    [],
  );

  const table = useReactTable({ data: query.data ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | '')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        {statuses.map((item) => (
          <option key={item || 'all'} value={item}>
            {item || 'Все статусы'}
          </option>
        ))}
      </select>
      {query.isLoading ? <StateMessage title="Загружаем заказы..." /> : null}
      {!query.isLoading && table.getRowModel().rows.length === 0 ? <StateMessage title="Заказов нет." /> : null}
      {table.getRowModel().rows.length > 0 ? <DataTable table={table} /> : null}
    </div>
  );
}

function DataTable({ table }: { table: ReturnType<typeof useReactTable<Order>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-3 py-3 font-black text-slate-600">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 text-slate-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
