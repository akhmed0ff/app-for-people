'use client';

import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { adjustDriverBalance, fetchDrivers, topUpDriver } from '../../shared/api/admin-api';
import { Driver } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatMoney } from '../../shared/utils/format';

type BalanceAction = 'top-up' | 'adjust';

type BalanceDialogState = {
  driver: Driver;
  action: BalanceAction;
} | null;

type BalanceForm = {
  amount: number;
  description?: string;
};

export default function DriversPage() {
  const [messageApi, contextHolder] = message.useMessage();
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
      messageApi.success('Баланс обновлен');
    },
    onError: () => messageApi.error('Не удалось обновить баланс'),
  });

  const columns: ColumnsType<Driver> = [
    {
      title: 'Driver',
      dataIndex: 'user',
      render: (_, driver) => `${driver.user.firstName} ${driver.user.lastName}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => <Tag color={driverStatusColor(status)}>{status}</Tag>,
    },
    { title: 'Plate', dataIndex: 'vehiclePlate' },
    {
      title: 'Vehicle',
      render: (_, driver) => `${driver.vehicleMake} ${driver.vehicleModel}`,
    },
    { title: 'Rating', dataIndex: 'rating' },
    {
      title: 'Balance',
      dataIndex: 'balance',
      render: (balance: number) => formatMoney(balance),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: 'Commission',
      dataIndex: 'commissionRatePercent',
      render: (value: number) => `${value}%`,
    },
    {
      title: 'Actions',
      render: (_, driver) => (
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setDialog({ driver, action: 'top-up' })}>
            Top up
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setDialog({ driver, action: 'adjust' })}>
            Adjust
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageHeader description="Search, filter, and monitor fleet availability." title="Drivers" />
      <Table
        columns={columns}
        dataSource={drivers.data ?? []}
        loading={drivers.isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1000 }}
      />
      <BalanceDialog
        dialog={dialog}
        loading={balanceMutation.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(values) => {
          if (!dialog) return;
          balanceMutation.mutate({
            driverId: dialog.driver.id,
            action: dialog.action,
            amount: values.amount,
            description: values.description,
          });
        }}
      />
    </>
  );
}

function BalanceDialog({
  dialog,
  loading,
  onClose,
  onSubmit,
}: {
  dialog: BalanceDialogState;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: BalanceForm) => void;
}) {
  const [form] = Form.useForm<BalanceForm>();
  const action = dialog?.action;
  const title = action === 'top-up' ? 'Top up driver balance' : 'Adjust driver balance';

  return (
    <Modal
      confirmLoading={loading}
      destroyOnClose
      onCancel={onClose}
      onOk={() => form.submit()}
      open={Boolean(dialog)}
      title={title}
    >
      {dialog ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <strong>
              {dialog.driver.user.firstName} {dialog.driver.user.lastName}
            </strong>
            <div>{formatMoney(dialog.driver.balance)}</div>
          </div>
          <Form
            form={form}
            initialValues={{ amount: action === 'top-up' ? 100000 : -20000, description: '' }}
            layout="vertical"
            onFinish={onSubmit}
          >
            <Form.Item
              label="Amount"
              name="amount"
              rules={[
                { required: true, message: 'Введите сумму' },
                {
                  validator: (_, value: number) =>
                    action === 'top-up' && value <= 0
                      ? Promise.reject(new Error('Пополнение должно быть больше 0'))
                      : Promise.resolve(),
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Space>
      ) : null}
    </Modal>
  );
}

function driverStatusColor(status: string) {
  if (status === 'ONLINE') return 'green';
  if (status === 'BUSY') return 'gold';
  if (status === 'BLOCKED') return 'red';
  return 'default';
}
