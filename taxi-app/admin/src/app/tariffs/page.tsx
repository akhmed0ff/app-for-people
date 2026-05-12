import { ProtectedLayout } from '../../components/ProtectedLayout';
import { TariffsView } from '../../features/tariffs/TariffsView';

export default function TariffsPage() {
  return (
    <ProtectedLayout title="Тарифы">
      <TariffsView />
    </ProtectedLayout>
  );
}
