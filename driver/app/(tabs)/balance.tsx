import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { fetchDriverBalance } from '../../src/shared/api/driver-api';
import { useDriverStore } from '../../src/shared/store/driver.store';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';
import { formatMoney } from '../../src/shared/utils/money';

export default function BalanceScreen() {
  const { balance, setBalance } = useDriverStore();

  useEffect(() => {
    void fetchDriverBalance().then(setBalance);
  }, [setBalance]);

  return (
    <Screen>
      <Text style={styles.title}>Balance</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <Section>
          <Text style={styles.label}>Current balance</Text>
          <Text style={styles.total}>{formatMoney(balance.balance)}</Text>
          <Text style={styles.label}>Trip commission</Text>
          <Text style={styles.value}>{balance.commissionRatePercent}%</Text>
          <Button label="Top-up instructions" onPress={() => router.push('/top-up')} />
        </Section>
        <Section>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {balance.lastTransactions.length === 0 ? (
            <Text style={styles.empty}>No transactions yet.</Text>
          ) : (
            balance.lastTransactions.map((transaction) => (
              <Text key={transaction.id} style={styles.transaction}>
                {transaction.type}: {formatMoney(transaction.amount)}
              </Text>
            ))
          )}
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 24 },
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  label: { color: '#667085', fontWeight: '700' },
  total: { color: '#17202a', fontSize: 30, fontWeight: '900' },
  value: { color: '#17202a', fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: '#17202a', fontSize: 18, fontWeight: '900' },
  empty: { color: '#667085', fontWeight: '700' },
  transaction: { color: '#17202a', fontSize: 15, fontWeight: '700' },
});
