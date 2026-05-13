'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchPassengers } from '../../shared/api/admin-api';
import { Passenger } from '../../shared/api/types';
import { PageHeader } from '../../shared/components/PageHeader';
import { formatDate } from '../../shared/utils/format';

const columns: ColumnsType<Passenger> = [
  { title: 'Passenger', render: (_, row) => `${row.user.firstName} ${row.user.lastName}` },
  { title: 'Phone', render: (_, row) => row.user.phone ?? '-' },
  { title: 'Email', render: (_, row) => row.user.email },
  { title: 'Rating', dataIndex: 'rating' },
  { title: 'Status', render: (_, row) => <Tag color={row.user.status === 'ACTIVE' ? 'green' : 'red'}>{row.user.status}</Tag> },
  { title: 'Joined', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
];

export default function PassengersPage() {
  const passengers = useQuery({ queryKey: ['passengers'], queryFn: fetchPassengers });

  return (
    <>
      <PageHeader description="Passenger accounts, contact data, and activity." title="Passengers" />
      <Table
        columns={columns}
        dataSource={passengers.data ?? []}
        loading={passengers.isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 900 }}
      />
    </>
  );
}
