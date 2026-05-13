'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchPayments } from '../../shared/api/admin-api';
import { Payment } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

const columns: ColumnsType<Payment> = [
  { title: 'Type', dataIndex: 'type' },
  { title: 'Status', dataIndex: 'status', render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag> },
  { title: 'Provider', dataIndex: 'provider', render: (provider?: string) => provider ?? '-' },
  { title: 'Amount', render: (_, row) => formatMoney(row.amountCents, row.currency) },
  { title: 'Description', dataIndex: 'description', render: (description?: string) => description ?? '-' },
  { title: 'Created', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
];

export default function PaymentsPage() {
  const payments = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });

  return (
    <>
      <PageHeader description="Transaction monitoring and payment reconciliation." title="Payments" />
      <Table
        columns={columns}
        dataSource={payments.data ?? []}
        loading={payments.isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 900 }}
      />
    </>
  );
}

function statusColor(status: string) {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED' || status === 'CANCELED') return 'red';
  return 'gold';
}
