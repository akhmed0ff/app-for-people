'use client';

import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const t = useTranslations('drivers');
  const tCommon = useTranslations('common');
  const tDriverStatus = useTranslations('statuses.drivers');

  const balanceMutation = useMutation({
    mutationFn: (input: { driverId: string; action: BalanceAction; amount: number; description?: string }) =>
      input.action === 'top-up'
        ? topUpDriver(input.driverId, { amount: input.amount, description: input.description })
        : adjustDriverBalance(input.driverId, { amount: input.amount, description: input.description }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDialog(null);
      messageApi.success(t('balanceUpdated'));
    },
    onError: () => messageApi.error(t('balanceUpdateFailed')),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (drivers.data ?? []).filter((driver) => {
      const statusMatches = statusFilter === 'all' || driver.status === statusFilter;
      if (!statusMatches) return false;
      if (!q) return true;
      const fullName = `${driver.user.firstName} ${driver.user.lastName}`.toLowerCase();
      const plate = driver.vehiclePlate.toLowerCase();
      const vehicle = `${driver.vehicleMake} ${driver.vehicleModel}`.toLowerCase();
      const phone = (driver.user.phone ?? '').toLowerCase();
      return fullName.includes(q) || plate.includes(q) || vehicle.includes(q) || phone.includes(q);
    });
  }, [drivers.data, search, statusFilter]);

  const columns: ColumnsType<Driver> = [
    {
      title: t('driver'),
      dataIndex: 'user',
      render: (_, driver) => `${driver.user.firstName} ${driver.user.lastName}`,
    },
    {
      title: tCommon('status'),
      dataIndex: 'status',
      render: (status: string) => <Tag color={driverStatusColor(status)}>{tDriverStatus(status)}</Tag>,
    },
    { title: t('plate'), dataIndex: 'vehiclePlate' },
    {
      title: t('vehicle'),
      render: (_, driver) => `${driver.vehicleMake} ${driver.vehicleModel}`,
    },
    { title: t('rating'), dataIndex: 'rating' },
    {
      title: t('balance'),
      dataIndex: 'balance',
      render: (balance: number) => formatMoney(balance),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: t('commission'),
      dataIndex: 'commissionRatePercent',
      render: (value: number) => `${value}%`,
    },
    {
      title: tCommon('actions'),
      render: (_, driver) => (
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setDialog({ driver, action: 'top-up' })}>
            {t('topUp')}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setDialog({ driver, action: 'adjust' })}>
            {t('adjust')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageHeader description={t('description')} title={t('title')} />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
        />
        <Select
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: tCommon('allStatuses') },
            { value: 'ONLINE', label: tDriverStatus('ONLINE') },
            { value: 'OFFLINE', label: tDriverStatus('OFFLINE') },
            { value: 'BUSY', label: tDriverStatus('BUSY') },
            { value: 'BLOCKED', label: tDriverStatus('BLOCKED') },
          ]}
          style={{ minWidth: 180 }}
          value={statusFilter}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filtered}
        loading={drivers.isLoading}
        locale={{ emptyText: tCommon('noData') }}
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
  const t = useTranslations('drivers');
  const tCommon = useTranslations('common');
  const action = dialog?.action;
  const title = action === 'top-up' ? t('topUpTitle') : t('adjustTitle');

  return (
    <Modal
      confirmLoading={loading}
      destroyOnClose
      okText={tCommon('save')}
      cancelText={tCommon('cancel')}
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
              label={t('amount')}
              name="amount"
              rules={[
                { required: true, message: t('amountRequired') },
                {
                  validator: (_, value: number) =>
                    action === 'top-up' && value <= 0
                      ? Promise.reject(new Error(t('positiveTopUpRequired')))
                      : Promise.resolve(),
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={tCommon('description')} name="description">
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
