import { StyleSheet, Text, View } from 'react-native';

export function StatusMessage({ title, tone = 'info' }: { title: string; tone?: 'info' | 'error' | 'empty' }) {
  return (
    <View style={[styles.box, styles[tone]]}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    padding: 12,
  },
  info: { backgroundColor: '#dbeafe' },
  error: { backgroundColor: '#fee2e2' },
  empty: { backgroundColor: '#f1f5f9' },
  text: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
  },
});
