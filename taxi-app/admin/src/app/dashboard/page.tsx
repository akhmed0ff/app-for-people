import { ProtectedLayout } from '../../components/ProtectedLayout';
import { DashboardView } from '../../features/dashboard/DashboardView';

export default function DashboardPage() {
  return (
    <ProtectedLayout title="Dashboard">
      <DashboardView />
    </ProtectedLayout>
  );
}
