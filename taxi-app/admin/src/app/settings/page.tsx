import { ProtectedLayout } from '../../components/ProtectedLayout';
import { Card } from '../../components/Ui';

export default function SettingsPage() {
  return (
    <ProtectedLayout title="Настройки">
      <Card>
        <h2 className="text-lg font-black text-slate-950">MVP настройки</h2>
        <p className="mt-2 text-sm text-slate-500">Production auth, платежи и аналитика будут добавлены отдельными этапами.</p>
      </Card>
    </ProtectedLayout>
  );
}
