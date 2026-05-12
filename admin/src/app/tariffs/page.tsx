'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { createTariff, fetchTariffs, updateTariff } from '../../shared/api/admin-api';
import { Tariff } from '../../shared/api/types';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

const emptyForm = {
  code: '',
  name: '',
  description: '',
  carSupplyPrice: 0,
  pricePerKm: 0,
  freeWaitingMinutes: 0,
  waitingPricePerMinute: 0,
  stopPrice: 0,
  minimumOrderPrice: 0,
  currency: 'UZS',
};

export default function TariffsPage() {
  const queryClient = useQueryClient();
  const tariffs = useQuery({ queryKey: ['tariffs'], queryFn: fetchTariffs });
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [form, setForm] = useState(emptyForm);

  const save = useMutation({
    mutationFn: () =>
      editing ? updateTariff(editing.id, form) : createTariff(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const columns: ColumnDef<Tariff>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'code', header: 'Code' },
    { cell: ({ row }) => formatMoney(row.original.carSupplyPrice), header: 'Supply' },
    { cell: ({ row }) => formatMoney(row.original.pricePerKm), header: 'Per km' },
    { accessorKey: 'freeWaitingMinutes', header: 'Free wait' },
    { cell: ({ row }) => formatMoney(row.original.waitingPricePerMinute), header: 'Wait/min' },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <button
          className="rounded-lg border border-line px-3 py-2 text-sm font-black"
          onClick={() => {
            setEditing(row.original);
            setForm({
              code: row.original.code,
              name: row.original.name,
              description: row.original.description ?? '',
              carSupplyPrice: row.original.carSupplyPrice,
              pricePerKm: row.original.pricePerKm,
              freeWaitingMinutes: row.original.freeWaitingMinutes,
              waitingPricePerMinute: row.original.waitingPricePerMinute,
              stopPrice: row.original.stopPrice,
              minimumOrderPrice: row.original.minimumOrderPrice,
              currency: row.original.currency,
            });
          }}
          type="button"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader description="Create and update pricing plans." title="Tariffs" />
      <div className="mb-6 rounded-lg border border-line bg-surface p-4">
        <h3 className="mb-4 text-lg font-black">{editing ? 'Edit tariff' : 'Create tariff'}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(form).map(([key, value]) => (
            <label className="text-sm font-bold text-muted" key={key}>
              {key}
              <input
                className="mt-1 h-10 w-full rounded-lg border border-line bg-transparent px-3 text-text outline-none"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: typeof value === 'number' ? Number(event.target.value) : event.target.value,
                  }))
                }
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="rounded-lg bg-brand px-4 py-2 font-black text-white disabled:opacity-50"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            type="button"
          >
            Save
          </button>
          {editing ? (
            <button
              className="rounded-lg border border-line px-4 py-2 font-black"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
      <DataTable columns={columns} data={tariffs.data ?? []} searchPlaceholder="Search tariffs" />
    </>
  );
}
