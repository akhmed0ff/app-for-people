'use client';

import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, InputNumber, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AntCard } from '../../shared/components/AntCard';
import { useState } from 'react';
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

  const save = useMutation({
    mutationFn: (values: TariffForm) => (editing ? updateTariff(editing.id, values) : createTariff(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      setEditing(null);
      form.resetFields();
      messageApi.success('Тариф сохранен');
    },
    onError: () => messageApi.error('Не удалось сохранить тариф'),
  });

  const columns: ColumnsType<Tariff> = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Code',
      dataIndex: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    { title: 'Supply', dataIndex: 'carSupplyPrice', render: (value: number) => formatMoney(value) },
    { title: 'Per km', dataIndex: 'pricePerKm', render: (value: number) => formatMoney(value) },
    { title: 'Free wait', dataIndex: 'freeWaitingMinutes', render: (value: number) => `${value} min` },
    { title: 'Wait/min', dataIndex: 'waitingPricePerMinute', render: (value: number) => formatMoney(value) },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
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
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageHeader description="Create and update pricing plans." title="Tariffs" />
      <AntCard
        style={{ marginBottom: 24 }}
        title={editing ? `Edit tariff ${editing.code}` : 'Create tariff'}
      >
        <Form
          form={form}
          initialValues={emptyForm}
          layout="vertical"
          onFinish={(values: TariffForm) => save.mutate(values)}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Введите код' }]}>
              <Input disabled={Boolean(editing)} />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Введите название' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Car supply price" name="carSupplyPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Price per km" name="pricePerKm" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Free waiting minutes" name="freeWaitingMinutes" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Waiting price/min" name="waitingPricePerMinute" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Stop price" name="stopPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Minimum order price" name="minimumOrderPrice" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space>
            <Button htmlType="submit" icon={<PlusOutlined />} loading={save.isPending} type="primary">
              Save
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            ) : null}
          </Space>
        </Form>
      </AntCard>
      <Table
        columns={columns}
        dataSource={tariffs.data ?? []}
        loading={tariffs.isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1000 }}
      />
    </>
  );
}
