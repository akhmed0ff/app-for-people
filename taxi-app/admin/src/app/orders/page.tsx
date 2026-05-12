import { ProtectedLayout } from '../../components/ProtectedLayout';
import { OrdersView } from '../../features/orders/OrdersView';

export default function OrdersPage() {
  return (
    <ProtectedLayout title="Заказы">
      <OrdersView />
    </ProtectedLayout>
  );
}
