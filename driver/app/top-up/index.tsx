import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/shared/ui/Button';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function TopUpScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Top-up instructions</Text>
      <Section>
        <Text style={styles.text}>
          For balance top-up, transfer the amount to the company card and send the receipt to the administrator.
        </Text>
        <Button label="Back to balance" onPress={() => router.replace('/(tabs)/balance')} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
  text: { color: '#17202a', fontSize: 16, fontWeight: '700', lineHeight: 23 },
});
