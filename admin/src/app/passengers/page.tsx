'use client';

import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { fetchPassengers } from '../../shared/api/admin-api';
import { Passenger } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate } from '../../shared/utils/format';

export default function PassengersPage() {
  const t = useTranslations('passengers');
  const tCommon = useTranslations('common');
  const tUserStatus = useTranslations('statuses.users');
  const passengers = useQuery({ queryKey: ['passengers'], queryFn: fetchPassengers });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return passengers.data ?? [];
    return (passengers.data ?? []).filter((p) => {
      const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
      const phone = (p.user.phone ?? '').toLowerCase();
      const email = p.user.email.toLowerCase();
      return fullName.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [passengers.data, search]);

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

      <Space style={{ marginBottom: 16 }}>
        <Input
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filtered}
        loading={passengers.isLoading}
        locale={{ emptyText: tCommon('noData') }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 800 }}
      />
    </>
  );
}
