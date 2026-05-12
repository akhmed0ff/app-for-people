'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { fetchPassengers } from '../../shared/api/admin-api';
import { Passenger } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate } from '../../shared/utils/format';

const columns: ColumnDef<Passenger>[] = [
  { accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`, header: 'Passenger' },
  { accessorFn: (row) => row.user.phone ?? '-', header: 'Phone' },
  { accessorFn: (row) => row.user.email, header: 'Email' },
  { accessorKey: 'rating', header: 'Rating' },
  { accessorFn: (row) => formatDate(row.createdAt), header: 'Joined' },
];

export default function PassengersPage() {
  const passengers = useQuery({ queryKey: ['passengers'], queryFn: fetchPassengers });

  return (
    <>
      <PageHeader description="Passenger accounts, contact data, and activity." title="Passengers" />
      <DataTable columns={columns} data={passengers.data ?? []} searchPlaceholder="Search passengers" />
    </>
  );
}
