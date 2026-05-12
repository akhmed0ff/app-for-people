'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { fetchDrivers } from '../../shared/api/admin-api';
import { Driver } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

const columns: ColumnDef<Driver>[] = [
  { accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`, header: 'Driver' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'vehiclePlate', header: 'Plate' },
  { accessorFn: (row) => `${row.vehicleMake} ${row.vehicleModel}`, header: 'Vehicle' },
  { accessorKey: 'rating', header: 'Rating' },
  {
    header: 'Balance',
    cell: ({ row }) =>
      formatMoney(row.original.balance?.availableCents ?? 0, row.original.balance?.currency),
  },
];

export default function DriversPage() {
  const drivers = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });

  return (
    <>
      <PageHeader description="Search, filter, and monitor fleet availability." title="Drivers" />
      <DataTable columns={columns} data={drivers.data ?? []} searchPlaceholder="Search drivers" />
    </>
  );
}
