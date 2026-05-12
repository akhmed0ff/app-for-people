import { ProtectedLayout } from '../../components/ProtectedLayout';
import { DriversView } from '../../features/drivers/DriversView';

export default function DriversPage() {
  return (
    <ProtectedLayout title="Водители">
      <DriversView />
    </ProtectedLayout>
  );
}
