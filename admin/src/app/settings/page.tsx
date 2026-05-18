'use client';

import { Button, Form, InputNumber, Switch, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { AntCard } from '../../shared/components/AntCard';
import { PageHeader } from '../../shared/components/PageHeader';

const SETTINGS_KEY = 'admin.settings';

type SettingsValues = {
  radius: number;
  strongSessions: boolean;
};

const defaults: SettingsValues = {
  radius: 5000,
  strongSessions: true,
};

function loadSettings(): SettingsValues {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function saveSettings(values: SettingsValues) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<SettingsValues>();

  // Hydrate form from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    form.setFieldsValue(loadSettings());
  }, [form]);

  function handleSave(values: SettingsValues) {
    saveSettings(values);
    // TODO: replace with API call when backend /admin/settings endpoint is ready:
    // await api.patch('/admin/settings', values);
    messageApi.success(t('saved'));
  }

  return (
    <>
      {contextHolder}
      <PageHeader description={t('description')} title={t('title')} />
      <Form
        form={form}
        initialValues={defaults}
        layout="vertical"
        onFinish={handleSave}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AntCard title={t('dispatch')}>
            <Form.Item
              label={t('defaultSearchRadius')}
              name="radius"
              rules={[{ required: true }]}
            >
              <InputNumber min={500} step={500} style={{ width: '100%' }} addonAfter="м" />
            </Form.Item>
          </AntCard>

          <AntCard title={t('security')}>
            <Form.Item
              label={t('strongAdminSessions')}
              name="strongSessions"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </AntCard>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button htmlType="submit" type="primary">
            {tCommon('save')}
          </Button>
        </div>
      </Form>
    </>
  );
}
