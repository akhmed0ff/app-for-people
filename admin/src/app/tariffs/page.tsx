'use client';

import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, InputNumber, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AntCard } from '../../shared/components/AntCard';
import { createTariff, fetchTariffs, updateTariff } from '../../shared/api/admin-api';
import { Tariff } from '../../shared/api/types';
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

type TariffForm = typeof emptyForm;

export default function TariffsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<TariffForm>();
  const queryClient = useQueryClient();
  const tariffs = useQuery({ queryKey: ['tariffs'], queryFn: fetchTariffs });
  const [editing, setEditing] = useState<Tariff | null>(null);
  const t = useTranslations('tariffs');
  const tCommon = useTranslations('common');

  const save = useMutation({
    mutationFn: (values: TariffForm) => (editing ? updateTariff(editing.id, values) : createTariff(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      setEditing(null);
      form.resetFields();
      messageApi.success(t('saved'));
    },
    onError: () => messageApi.error(t('saveFailed')),
  });

  const columns: ColumnsType<Tariff> = [
    { title: t('name'), dataIndex: 'name' },
    {
      title: t('code'),
      dataIndex: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    { title: t('supply'), dataIndex: 'carSupplyPrice', render: (value: number) => formatMoney(value) },
    { title: t('perKm'), dataIndex: 'pricePerKm', render: (value: number) => formatMoney(value) },
    { title: t('freeWait'), dataIndex: 'freeWaitingMinutes', render: (value: number) => t('minutes', { value }) },
    { title: t('waitPerMinute'), dataIndex: 'waitingPricePerMinute', render: (value: number) => formatMoney(value) },
    {
      title: tCommon('status'),
      dataIndex: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? tCommon('active') : tCommon('inactive')}</Tag>
      ),
    },
    {
      title: tCommon('actions'),
      render: (_, tariff) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            setEditing(tariff);
            form.setFieldsValue({
              code: tariff.code,
              name: tariff.name,
              description: tariff.description ?? '',
              carSupplyPrice: tariff.carSupplyPrice,
              pricePerKm: tariff.pricePerKm,
              freeWaitingMinutes: tariff.freeWaitingMinutes,
              waitingPricePerMinute: tariff.waitingPricePerMinute,
              stopPrice: tariff.stopPrice,
              minimumOrderPrice: tariff.minimumOrderPrice,
              currency: tariff.currency,
            });
          }}
        >
          {tCommon('edit')}
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageHeader description={t('description')} title={t('title')} />
      <AntCard
        style={{ marginBottom: 24 }}
        title={editing ? t('editTitle', { code: editing.code }) : t('createTitle')}
      >
        <Form
          form={form}
          initialValues={emptyForm}
          layout="vertical"
          onFinish={(values: TariffForm) => save.mutate(values)}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Form.Item label={t('code')} name="code" rules={[{ required: true, message: t('codeRequired') }]}>
              <Input disabled={Boolean(editing)} />
            </Form.Item>
            <Form.Item label={t('name')} name="name" rules={[{ required: true, message: t('nameRequired') }]}>
              <Input />
            </Form.Item>
            <Form.Item label={t('currency')} name="currency" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={t('carSupplyPrice')} name="carSupplyPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('pricePerKm')} name="pricePerKm" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('freeWaitingMinutes')} name="freeWaitingMinutes" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('waitingPricePerMinute')} name="waitingPricePerMinute" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('stopPrice')} name="stopPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('minimumOrderPrice')} name="minimumOrderPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label={tCommon('description')} name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space>
            <Button htmlType="submit" icon={<PlusOutlined />} loading={save.isPending} type="primary">
              {tCommon('save')}
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  form.resetFields();
                }}
              >
                {tCommon('cancel')}
              </Button>
            ) : null}
          </Space>
        </Form>
      </AntCard>
      <Table
        columns={columns}
        dataSource={tariffs.data ?? []}
        loading={tariffs.isLoading}
        locale={{ emptyText: tCommon('noData') }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1000 }}
      />
    </>
  );
}
