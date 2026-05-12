import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/Button';
import { MapboxPreview } from '../components/MapboxPreview';
import { Screen, Section } from '../components/Screen';
import { StatusMessage } from '../components/StatusMessage';
import { TopBar } from '../components/TopBar';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useSocketStore } from '../store/socketStore';

export function HomeScreen() {
  const route = useLocationStore((state) => state.route);
  const user = useAuthStore((state) => state.user);
  const isConnected = useSocketStore((state) => state.isConnected);

  return (
    <Screen>
      <TopBar title="Куда едем?" rightLabel="История" />
      <MapboxPreview route={route} />

      <Section>
        <Text style={styles.hello}>Здравствуйте{user?.name ? `, ${user.name}` : ''}</Text>
        <StatusMessage
          title={isConnected ? 'Realtime подключен.' : 'Realtime подключается после входа.'}
          tone="info"
        />
      </Section>

      <Section>
        <RouteRow label="Откуда" value={route.pickup.address} />
        <RouteRow label="Куда" value={route.destination.address} />
        <RouteRow label="Дистанция" value={`${route.distanceKm} км`} />
        <Button title="Выбрать тариф" onPress={() => router.push('/tariffs')} />
      </Section>
    </Screen>
  );
}

function RouteRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hello: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  row: {
    gap: 4,
    paddingVertical: 4,
  },
  label: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
});
