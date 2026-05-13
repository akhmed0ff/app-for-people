'use client';

import { LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Button, Space, Typography, message } from 'antd';
import { AntCard } from '../../shared/components/AntCard';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../../shared/api/admin-api';
import { useAuth } from '../../shared/auth/auth-store';

export default function LoginPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const auth = useAuth();
  const login = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (tokens) => {
      auth.setTokens(tokens);
      router.replace('/');
    },
    onError: () => messageApi.error('Login failed. Check backend env.'),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      {contextHolder}
      <AntCard style={{ maxWidth: 420, width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">Taxi Admin</Typography.Text>
            <Typography.Title level={2} style={{ marginBottom: 0, marginTop: 8 }}>
              Admin Login
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              Local development login uses the backend admin dev-login endpoint.
            </Typography.Paragraph>
          </div>
          <Button
            block
            icon={<LockOutlined />}
            loading={login.isPending}
            onClick={() => login.mutate()}
            size="large"
            type="primary"
          >
            Sign in as admin
          </Button>
        </Space>
      </AntCard>
    </main>
  );
}
