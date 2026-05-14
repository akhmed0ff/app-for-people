'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { fetchPayments } from '../../shared/api/admin-api';
import { Payment } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate, formatMoney } from '../../shared/utils/format';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const tCommon = useTranslations('common');
  const tPaymentStatus = useTranslations('statuses.payments');
  const payments = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });

  const columns: ColumnsType<Payment> = [
    { title: t('type'), dataIndex: 'type' },
    {
      title: tCommon('status'),
      dataIndex: 'status',
      render: (status: string) => <Tag color={statusColor(status)}>{tPaymentStatus(status)}</Tag>,
    },
    { title: t('provider'), dataIndex: 'provider', render: (provider?: string) => provider ?? '-' },
    { title: t('amount'), render: (_, row) => formatMoney(row.amountCents, row.currency) },
    { title: tCommon('description'), dataIndex: 'description', render: (description?: string) => description ?? '-' },
    { title: tCommon('created'), dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
  ];

  return (
    <>
      <PageHeader description={t('description')} title={t('title')} />
      <Table
        columns={columns}
        dataSource={payments.data ?? []}
        loading={payments.isLoading}
        locale={{ emptyText: tCommon('noData') }}
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
