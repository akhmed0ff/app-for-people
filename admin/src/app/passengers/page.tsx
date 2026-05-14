'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { fetchPassengers } from '../../shared/api/admin-api';
import { Passenger } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate } from '../../shared/utils/format';

export default function PassengersPage() {
  const t = useTranslations('passengers');
  const tCommon = useTranslations('common');
  const tUserStatus = useTranslations('statuses.users');
  const passengers = useQuery({ queryKey: ['passengers'], queryFn: fetchPassengers });

  const columns: ColumnsType<Passenger> = [
    { title: t('passenger'), render: (_, row) => `${row.user.firstName} ${row.user.lastName}` },
    { title: t('phone'), render: (_, row) => row.user.phone ?? '-' },
    { title: t('email'), render: (_, row) => row.user.email },
    { title: t('rating'), dataIndex: 'rating' },
    {
      title: tCommon('status'),
      render: (_, row) => (
        <Tag color={row.user.status === 'ACTIVE' ? 'green' : 'red'}>{tUserStatus(row.user.status)}</Tag>
      ),
    },
    { title: t('joined'), dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
  ];

  return (
    <>
      <PageHeader description={t('description')} title={t('title')} />
      <Table
        columns={columns}
        dataSource={passengers.data ?? []}
        loading={passengers.isLoading}
        locale={{ emptyText: tCommon('noData') }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 900 }}
      />
    </>
  );
}
