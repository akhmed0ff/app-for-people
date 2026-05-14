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
import { Avatar, Button, Layout, Menu, Select, Space, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/auth-store';
import { ThemeToggle } from './ThemeToggle';

const { Header, Content, Sider } = Layout;

const nav = [
  { href: '/', labelKey: 'dashboard', icon: <DashboardOutlined /> },
  { href: '/drivers', labelKey: 'drivers', icon: <CarOutlined /> },
  { href: '/passengers', labelKey: 'passengers', icon: <TeamOutlined /> },
  { href: '/orders', labelKey: 'orders', icon: <UserOutlined /> },
  { href: '/tariffs', labelKey: 'tariffs', icon: <TagsOutlined /> },
  { href: '/payments', labelKey: 'payments', icon: <CreditCardOutlined /> },
  { href: '/analytics', labelKey: 'analytics', icon: <BarChartOutlined /> },
  { href: '/settings', labelKey: 'settings', icon: <SettingOutlined /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const locale = useLocale();
  const tApp = useTranslations('app');
  const tNav = useTranslations('nav');

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
              <Typography.Text strong>{tApp('brand')}</Typography.Text>
              <Typography.Text className="admin-brand-subtitle">{tApp('brandSubtitle')}</Typography.Text>
            </div>
          ) : null}
        </div>
        <Menu
          items={nav.map((item) => ({
            key: item.href,
            icon: item.icon,
            label: <Link href={item.href}>{tNav(item.labelKey)}</Link>,
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
              <Typography.Text strong>{tApp('headerTitle')}</Typography.Text>
              <Typography.Text className="admin-header-subtitle">{tApp('headerSubtitle')}</Typography.Text>
            </div>
          </Space>
          <Space>
            <ThemeToggle />
            <Select
              aria-label={tApp('language')}
              onChange={(nextLocale: string) => {
                document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
                router.refresh();
              }}
              options={[
                { value: 'ru', label: tApp('languages.ru') },
                { value: 'uz', label: tApp('languages.uz') },
              ]}
              size="middle"
              style={{ width: 120 }}
              value={locale}
            />
            <Button
              onClick={() => {
                auth.logout();
                router.replace('/login');
              }}
            >
              {tApp('logout')}
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
