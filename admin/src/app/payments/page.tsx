'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { fetchPayments } from '../../shared/api/admin-api';
import { Payment } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

const columns: ColumnDef<Payment>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'provider', header: 'Provider' },
  { cell: ({ row }) => formatMoney(row.original.amountCents, row.original.currency), header: 'Amount' },
  { accessorFn: (row) => formatDate(row.createdAt), header: 'Created' },
];

export default function PaymentsPage() {
  const payments = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });

  return (
    <>
      <PageHeader description="Transaction monitoring and payment reconciliation." title="Payments" />
      <DataTable columns={columns} data={payments.data ?? []} searchPlaceholder="Search payments" />
    </>
  );
}
