'use client';

import { Form, InputNumber, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import { AntCard } from '../../shared/components/AntCard';
import { PageHeader } from '../../shared/components/PageHeader';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <>
      <PageHeader description={t('description')} title={t('title')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AntCard title={t('dispatch')}>
          <Form initialValues={{ radius: 5000 }} layout="vertical">
            <Form.Item label={t('defaultSearchRadius')} name="radius">
              <InputNumber min={1000} step={500} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </AntCard>
        <AntCard title={t('security')}>
          <Form initialValues={{ strongSessions: true }} layout="vertical">
            <Form.Item label={t('strongAdminSessions')} name="strongSessions" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </AntCard>
      </div>
    </>
  );
}
