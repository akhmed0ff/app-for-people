'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adjustDriverBalance, fetchDrivers, topUpDriver } from '../../shared/api/admin-api';
import { Driver } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

type BalanceAction = 'top-up' | 'adjust';

type BalanceDialogState = {
  driver: Driver;
  action: BalanceAction;
} | null;

export default function DriversPage() {
  const queryClient = useQueryClient();
  const drivers = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
  const [dialog, setDialog] = useState<BalanceDialogState>(null);

  const balanceMutation = useMutation({
    mutationFn: (input: { driverId: string; action: BalanceAction; amount: number; description?: string }) =>
      input.action === 'top-up'
        ? topUpDriver(input.driverId, { amount: input.amount, description: input.description })
        : adjustDriverBalance(input.driverId, { amount: input.amount, description: input.description }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialog(null);
    },
  });

  const columns: ColumnDef<Driver>[] = [
    { accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`, header: 'Driver' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'vehiclePlate', header: 'Plate' },
    { accessorFn: (row) => `${row.vehicleMake} ${row.vehicleModel}`, header: 'Vehicle' },
    { accessorKey: 'rating', header: 'Rating' },
    { accessorFn: (row) => formatMoney(row.balance), header: 'Balance' },
    { accessorFn: (row) => `${row.commissionRatePercent}%`, header: 'Commission' },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="row-actions">
          <button type="button" onClick={() => setDialog({ driver: row.original, action: 'top-up' })}>
            Top up
          </button>
          <button type="button" onClick={() => setDialog({ driver: row.original, action: 'adjust' })}>
            Adjust
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader description="Search, filter, and monitor fleet availability." title="Drivers" />
      <DataTable columns={columns} data={drivers.data ?? []} searchPlaceholder="Search drivers" />
      {dialog ? (
        <BalanceDialog
          action={dialog.action}
          driver={dialog.driver}
          loading={balanceMutation.isPending}
          onClose={() => setDialog(null)}
          onSubmit={(amount, description) =>
            balanceMutation.mutate({ driverId: dialog.driver.id, action: dialog.action, amount, description })
          }
        />
      ) : null}
    </>
  );
}

function BalanceDialog({
  action,
  driver,
  loading,
  onClose,
  onSubmit,
}: {
  action: BalanceAction;
  driver: Driver;
  loading: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description?: string) => void;
}) {
  const [amount, setAmount] = useState(action === 'top-up' ? '100000' : '-20000');
  const [description, setDescription] = useState('');
  const title = action === 'top-up' ? 'Top up driver balance' : 'Adjust driver balance';

  return (
    <div className="modal-backdrop">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(amount);
          if (!Number.isFinite(parsed) || (action === 'top-up' && parsed <= 0)) {
            return;
          }
          onSubmit(parsed, description || undefined);
        }}
      >
        <h2>{title}</h2>
        <p>
          {driver.user.firstName} {driver.user.lastName} · {formatMoney(driver.balance)}
        </p>
        <label>
          Amount
          <input inputMode="numeric" onChange={(event) => setAmount(event.target.value)} value={amount} />
        </label>
        <label>
          Description
          <textarea onChange={(event) => setDescription(event.target.value)} value={description} />
        </label>
        <div className="row-actions">
          <button disabled={loading} type="submit">
            Save
          </button>
          <button disabled={loading} onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
