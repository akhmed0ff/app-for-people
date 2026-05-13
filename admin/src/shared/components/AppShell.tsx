'use client';

import {
  BarChartOutlined,
  CarOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/auth-store';

const { Header, Content, Sider } = Layout;

const nav = [
  { href: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { href: '/drivers', label: 'Drivers', icon: <CarOutlined /> },
  { href: '/passengers', label: 'Passengers', icon: <TeamOutlined /> },
  { href: '/orders', label: 'Orders', icon: <UserOutlined /> },
  { href: '/tariffs', label: 'Tariffs', icon: <TagsOutlined /> },
  { href: '/payments', label: 'Payments', icon: <CreditCardOutlined /> },
  { href: '/analytics', label: 'Analytics', icon: <BarChartOutlined /> },
  { href: '/settings', label: 'Settings', icon: <SettingOutlined /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const selectedKeys = useMemo(() => {
    const match = nav.find((item) => item.href === pathname);
    return [match?.href ?? '/'];
  }, [pathname]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <Layout className="admin-shell">
      <Sider
        breakpoint="lg"
        collapsed={collapsed}
        collapsedWidth={72}
        collapsible
        onCollapse={setCollapsed}
        theme="light"
        trigger={null}
        width={260}
      >
        <div className="admin-brand">
          <Avatar shape="square" size={40} style={{ backgroundColor: '#0f766e', fontWeight: 900 }}>
            TX
          </Avatar>
          {!collapsed ? (
            <div>
              <Typography.Text strong>Taxi Admin</Typography.Text>
              <Typography.Text className="admin-brand-subtitle">Operations</Typography.Text>
            </div>
          ) : null}
        </div>
        <Menu
          items={nav.map((item) => ({
            key: item.href,
            icon: item.icon,
            label: <Link href={item.href}>{item.label}</Link>,
          }))}
          mode="inline"
          selectedKeys={selectedKeys}
        />
      </Sider>

      <Layout>
        <Header className="admin-header">
          <Space>
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              type="text"
            />
            <div>
              <Typography.Text strong>Realtime operations console</Typography.Text>
              <Typography.Text className="admin-header-subtitle">Dispatch, fleet, matching and pricing</Typography.Text>
            </div>
          </Space>
          <Space>
            <Button
              onClick={() => {
                auth.logout();
                router.replace('/login');
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
