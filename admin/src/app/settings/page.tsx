'use client';

import { Form, InputNumber, Switch } from 'antd';
import { AntCard } from '../../shared/components/AntCard';
import { PageHeader } from '../../shared/components/PageHeader';

export default function SettingsPage() {
  return (
    <>
      <PageHeader description="Operational defaults and security preferences." title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AntCard title="Dispatch">
          <Form initialValues={{ radius: 5000 }} layout="vertical">
            <Form.Item label="Default search radius" name="radius">
              <InputNumber min={1000} step={500} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </AntCard>
        <AntCard title="Security">
          <Form initialValues={{ strongSessions: true }} layout="vertical">
            <Form.Item label="Require strong admin sessions" name="strongSessions" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </AntCard>
      </div>
    </>
  );
}
