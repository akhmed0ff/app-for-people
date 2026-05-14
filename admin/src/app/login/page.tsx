'use client';

import { LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Space, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';
import { AntCard } from '../../shared/components/AntCard';
import { useRouter } from 'next/navigation';
import { getAdminLoginErrorMessage, loginAdmin } from '../../shared/api/admin-api';
import { useAuth } from '../../shared/auth/auth-store';

export default function LoginPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const auth = useAuth();
  const t = useTranslations('login');
  const login = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (tokens) => {
      auth.setTokens(tokens);
      router.replace('/');
    },
    onError: (error) => messageApi.error(getAdminLoginErrorMessage(error)),
  });
  const loginError = login.error ? getAdminLoginErrorMessage(login.error) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      {contextHolder}
      <AntCard style={{ maxWidth: 420, width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">{t('eyebrow')}</Typography.Text>
            <Typography.Title level={2} style={{ marginBottom: 0, marginTop: 8 }}>
              {t('title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              {t('description')}
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
            {t('signIn')}
          </Button>
          {loginError ? <Alert message={loginError} showIcon type="error" /> : null}
        </Space>
      </AntCard>
    </main>
  );
}
