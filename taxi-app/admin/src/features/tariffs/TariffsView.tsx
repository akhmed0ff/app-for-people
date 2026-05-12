'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTariffsApi, tariffsApi } from '../../api/tariffs';
import { Badge, Button, Card, StateMessage } from '../../components/Ui';
import { Tariff, TariffPayload } from '../../types/api';

const emptyForm: TariffPayload = {
  code: '',
  name: '',
  baseFare: 0,
  pricePerKm: 0,
  freeWaitingMinutes: 0,
  waitingPricePerMinute: 0,
  stopPricePerMinute: 0,
  minimumFare: 0,
  isActive: true,
};

export function TariffsView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TariffPayload>(emptyForm);
  const query = useQuery({ queryKey: ['tariffs'], queryFn: tariffsApi.getAll });
  const save = useMutation({
    mutationFn: () => (editingId ? adminTariffsApi.update(editingId, form) : adminTariffsApi.create(form)),
    onSuccess: () => {
      setEditingId(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
    },
  });
  const toggle = useMutation({
    mutationFn: adminTariffsApi.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tariffs'] }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  const edit = (tariff: Tariff) => {
    setEditingId(tariff.id);
    setForm({
      code: tariff.code,
      name: tariff.name,
      baseFare: tariff.baseFare,
      pricePerKm: tariff.pricePerKm,
      freeWaitingMinutes: tariff.freeWaitingMinutes,
      waitingPricePerMinute: tariff.waitingPricePerMinute,
      stopPricePerMinute: tariff.stopPricePerMinute,
      minimumFare: tariff.minimumFare,
      isActive: tariff.isActive,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <h2 className="text-lg font-black text-slate-950">{editingId ? 'Редактировать тариф' : 'Создать тариф'}</h2>
          <Input label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
          <Input label="Название" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <NumberInput label="Подача" value={form.baseFare} onChange={(value) => setForm({ ...form, baseFare: value })} />
          <NumberInput label="Цена за км" value={form.pricePerKm} onChange={(value) => setForm({ ...form, pricePerKm: value })} />
          <NumberInput label="Бесплатное ожидание" value={form.freeWaitingMinutes} onChange={(value) => setForm({ ...form, freeWaitingMinutes: value })} />
          <NumberInput label="Ожидание/мин" value={form.waitingPricePerMinute} onChange={(value) => setForm({ ...form, waitingPricePerMinute: value })} />
          <NumberInput label="Остановка/мин" value={form.stopPricePerMinute} onChange={(value) => setForm({ ...form, stopPricePerMinute: value })} />
          <NumberInput label="Минимальный заказ" value={form.minimumFare} onChange={(value) => setForm({ ...form, minimumFare: value })} />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            Активен
          </label>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Сохранить' : 'Создать'}</Button>
            {editingId ? <Button onClick={() => { setEditingId(null); setForm(emptyForm); }} variant="secondary">Сброс</Button> : null}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {query.isLoading ? <StateMessage title="Загружаем тарифы..." /> : null}
        {!query.isLoading && (query.data ?? []).length === 0 ? <StateMessage title="Активных тарифов нет." /> : null}
        {(query.data ?? []).map((tariff) => (
          <Card key={tariff.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-950">{tariff.name}</h3>
                  <Badge tone={tariff.isActive ? 'green' : 'red'}>{tariff.isActive ? 'ON' : 'OFF'}</Badge>
                </div>
                <p className="text-sm text-slate-500">{tariff.code}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => edit(tariff)} variant="secondary">Редактировать</Button>
                <Button onClick={() => toggle.mutate(tariff.id)} variant={tariff.isActive ? 'danger' : 'primary'}>
                  {tariff.isActive ? 'Выключить' : 'Включить'}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
              <div>Подача: {tariff.baseFare}</div>
              <div>Км: {tariff.pricePerKm}</div>
              <div>Мин: {tariff.minimumFare}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}
