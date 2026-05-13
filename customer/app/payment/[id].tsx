import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { useBookingStore } from '../../src/shared/store/booking.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { formatMoney } from '../../src/shared/utils/pricing';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const estimate = useBookingStore((state) => state.estimate);
  const resetBooking = useBookingStore((state) => state.resetBooking);

  function pay() {
    Alert.alert('Оплата', 'Оплата наличными подтверждена.');
    resetBooking();
    router.replace('/(tabs)/history');
  }

  return (
    <Screen>
      <Text style={styles.title}>Оплата</Text>
      <Section>
        <Text style={styles.label}>Заказ</Text>
        <Text style={styles.value}>{id}</Text>
        <Text style={styles.label}>К оплате</Text>
        <Text style={styles.total}>
          {estimate ? formatMoney(estimate.estimatedPrice) : 'После завершения поездки'}
        </Text>
        <Button label="Оплатить наличными" onPress={pay} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#17202a',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  label: {
    color: '#667085',
    fontWeight: '700',
  },
  value: {
    color: '#17202a',
    fontSize: 15,
  },
  total: {
    color: '#17202a',
    fontSize: 28,
    fontWeight: '900',
  },
});
