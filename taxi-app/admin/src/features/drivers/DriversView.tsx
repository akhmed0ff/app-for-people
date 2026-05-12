'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { adminDriversApi } from '../../api/drivers';
import { Badge, Button, StateMessage } from '../../components/Ui';
import { Driver, DriverStatus } from '../../types/api';

const statuses: Array<DriverStatus | ''> = ['', 'OFFLINE', 'ONLINE', 'BUSY', 'BLOCKED'];

export function DriversView() {
  const [status, setStatus] = useState<DriverStatus | ''>('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-drivers', status],
    queryFn: () => adminDriversApi.getAll(status || undefined),
  });
  const block = useMutation({
    mutationFn: adminDriversApi.block,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }),
  });
  const unblock = useMutation({
    mutationFn: adminDriversApi.unblock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }),
  });

  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      { header: 'Статус', accessorKey: 'status', cell: ({ row }) => <Badge tone={row.original.status === 'BLOCKED' ? 'red' : 'green'}>{row.original.status}</Badge> },
      { header: 'Phone', accessorKey: 'userId' },
      { header: 'Name', accessorKey: 'id' },
      { header: 'Модель', accessorKey: 'carModel' },
      { header: 'Номер', accessorKey: 'carNumber' },
      { header: 'Баланс', accessorKey: 'balance' },
      { header: 'Рейтинг', accessorKey: 'rating' },
      {
        header: 'Действия',
        cell: ({ row }) =>
          row.original.status === 'BLOCKED' ? (
            <Button onClick={() => unblock.mutate(row.original.id)} variant="secondary">Разблокировать</Button>
          ) : (
            <Button onClick={() => block.mutate(row.original.id)} variant="danger">Заблокировать</Button>
          ),
      },
    ],
    [block, unblock],
  );
  const table = useReactTable({ data: query.data ?? [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <select value={status} onChange={(event) => setStatus(event.target.value as DriverStatus | '')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        {statuses.map((item) => (
          <option key={item || 'all'} value={item}>{item || 'Все статусы'}</option>
        ))}
      </select>
      {query.isLoading ? <StateMessage title="Загружаем водителей..." /> : null}
      {!query.isLoading && table.getRowModel().rows.length === 0 ? <StateMessage title="Водителей нет." /> : null}
      {table.getRowModel().rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-3 py-3 font-black text-slate-600">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-3 py-3 text-slate-700">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
