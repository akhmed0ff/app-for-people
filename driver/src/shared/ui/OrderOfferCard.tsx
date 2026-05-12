import { StyleSheet, Text, View } from 'react-native';
import { OrderOffer } from '../api/types';
import { Button } from './Button';

type OrderOfferCardProps = {
  offer: OrderOffer;
  onAccept: () => void;
};

export function OrderOfferCard({ offer, onAccept }: OrderOfferCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{offer.pickupAddress}</Text>
      <Text style={styles.route}>{offer.dropoffAddress}</Text>
      <Text style={styles.meta}>
        {offer.distanceToPickupMeters ? `${offer.distanceToPickupMeters} м до подачи` : 'Новый заказ'}
      </Text>
      <Button label="Принять" onPress={onAccept} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  title: {
    color: '#17202a',
    fontSize: 17,
    fontWeight: '900',
  },
  route: {
    color: '#344054',
    fontSize: 15,
  },
  meta: {
    color: '#667085',
    fontWeight: '700',
  },
});
