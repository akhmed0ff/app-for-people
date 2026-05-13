import { StyleSheet, Text, View } from 'react-native';
import { OrderOffer } from '../api/types';
import { formatMoney } from '../utils/money';
import { Button } from './Button';

type OrderOfferCardProps = {
  offer: OrderOffer;
  secondsLeft: number;
  accepting?: boolean;
  rejecting?: boolean;
  onAccept: () => void;
  onReject: () => void;
};

export function OrderOfferCard({
  offer,
  secondsLeft,
  accepting,
  rejecting,
  onAccept,
  onReject,
}: OrderOfferCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Новый заказ</Text>
        <Text style={styles.timer}>{secondsLeft}s</Text>
      </View>
      <Text style={styles.label}>Подача</Text>
      <Text style={styles.title}>{offer.pickupAddress || '-'}</Text>
      <Text style={styles.label}>Назначение</Text>
      <Text style={styles.route}>{offer.destinationAddress || '-'}</Text>
      <View style={styles.metaGrid}>
        <Text style={styles.meta}>Тариф: {offer.tariffCode ?? '-'}</Text>
        <Text style={styles.meta}>Цена: {offer.estimatedPrice ? formatMoney(offer.estimatedPrice) : '-'}</Text>
        <Text style={styles.meta}>
          До подачи: {offer.distanceToPickupKm ? `${offer.distanceToPickupKm.toFixed(1)} км` : '-'}
        </Text>
        <Text style={styles.meta}>Маршрут: {offer.distanceKm ? `${offer.distanceKm.toFixed(1)} км` : '-'}</Text>
        <Text style={styles.meta}>
          ETA маршрута: {offer.routeDurationMinutes ? `${offer.routeDurationMinutes} мин` : '-'}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button disabled={accepting || rejecting} label="Принять" onPress={onAccept} />
        <Button disabled={accepting || rejecting} label="Отклонить" onPress={onReject} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  eyebrow: { color: '#1d4ed8', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#667085', fontSize: 12, fontWeight: '800' },
  meta: { color: '#344054', fontWeight: '700' },
  metaGrid: { gap: 4 },
  route: { color: '#344054', fontSize: 15, fontWeight: '700' },
  timer: { color: '#dc2626', fontSize: 20, fontWeight: '900' },
  title: { color: '#17202a', fontSize: 17, fontWeight: '900' },
});
