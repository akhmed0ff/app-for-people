import { StyleSheet, Text, View } from 'react-native';
import { useConnectionStore } from '../store/connection.store';

export function ConnectionBanner() {
  const { status, reconnectAttempt, lastError } = useConnectionStore();

  if (status === 'connected' || status === 'idle') {
    return null;
  }

  const label =
    status === 'reconnecting'
      ? `Reconnecting... ${reconnectAttempt}`
      : status === 'connecting'
        ? 'Connecting...'
        : lastError ?? 'Offline. Retrying connection.';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
