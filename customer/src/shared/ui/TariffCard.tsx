import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteEstimate, Tariff } from '../api/types';
import { formatMoney } from '../utils/pricing';

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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected && styles.selected, disabled && styles.disabled]}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{tariff.name}</Text>
        <Text style={[styles.meta, Boolean(error) && styles.errorText]}>
          {loading
            ? 'Считаем маршрут...'
            : estimate
              ? `${estimate.distanceKm.toFixed(1)} км • ${estimate.durationMinutes} мин`
              : error ?? 'Маршрут не рассчитан'}
        </Text>
      </View>
      <Text style={[styles.price, Boolean(error) && styles.errorText]}>
        {estimate ? formatMoney(estimate.estimatedPrice, tariff.currency) : 'Недоступен'}
      </Text>
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
  disabled: {
    opacity: 0.55,
  },
  info: {
    flex: 1,
    paddingRight: 12,
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
    textAlign: 'right',
  },
  errorText: {
    color: '#b42318',
  },
});
