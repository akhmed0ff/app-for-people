import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RouteEstimate, Tariff } from '../api/types';
import { formatMoney } from '../utils/pricing';

const CAR_IMAGES: Record<string, string> = {
  ECONOMY: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  COMFORT: 'https://cdn-icons-png.flaticon.com/512/3097/3097144.png',
  PREMIUM: 'https://cdn-icons-png.flaticon.com/512/3097/3097257.png',
};

type TariffCardProps = {
  tariff: Tariff;
  selected: boolean;
  onPress: () => void;
  estimate?: RouteEstimate | null;
  disabled?: boolean;
  error?: string | null;
  loading?: boolean;
};

export function TariffCard({
  tariff,
  selected,
  onPress,
  estimate,
  disabled,
  error,
  loading,
}: TariffCardProps) {
  const duration = estimate ? estimate.durationMinutes : null;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected && styles.selected, disabled && !loading && styles.disabled]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{tariff.name}</Text>
        <Text style={styles.seats}>👤 4</Text>
      </View>
      {duration ? <Text style={styles.time}>{duration} мин ⚡</Text> : null}
      <Image
        resizeMode="contain"
        source={{ uri: CAR_IMAGES[tariff.code] ?? CAR_IMAGES['ECONOMY'] }}
        style={styles.car}
      />
      <Text style={styles.price}>
        {loading
          ? '...'
          : estimate
            ? `от ${formatMoney(estimate.estimatedPrice, tariff.currency)}`
            : 'от — сум'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    width: 140,
  },
  selected: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  disabled: { opacity: 0.5 },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: { color: '#111827', fontSize: 14, fontWeight: '700' },
  seats: { color: '#6b7280', fontSize: 12 },
  time: { alignSelf: 'flex-start', color: '#f59e0b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  car: { height: 60, marginVertical: 8, width: 110 },
  price: { color: '#111827', fontSize: 13, fontWeight: '700' },
});
