import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tariff } from '../api/types';
import { formatMoney } from '../utils/pricing';

type TariffCardProps = {
  tariff: Tariff;
  selected: boolean;
  onPress: () => void;
};

export function TariffCard({ tariff, selected, onPress }: TariffCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
    >
      <View>
        <Text style={styles.name}>{tariff.name}</Text>
        <Text style={styles.meta}>{formatMoney(tariff.pricePerKm, tariff.currency)} / км</Text>
      </View>
      <Text style={styles.price}>{formatMoney(tariff.carSupplyPrice, tariff.currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    padding: 14,
  },
  selected: {
    borderColor: '#0f766e',
    borderWidth: 2,
  },
  name: {
    color: '#17202a',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: '#667085',
    marginTop: 4,
  },
  price: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '800',
  },
});
