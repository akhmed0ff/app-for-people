import { StyleSheet, Text, View } from 'react-native';

interface StatusMessageProps {
  title: string;
  tone?: 'info' | 'error' | 'empty';
}

export function StatusMessage({ title, tone = 'info' }: StatusMessageProps) {
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
  info: {
    backgroundColor: '#dbeafe',
  },
  error: {
    backgroundColor: '#fee2e2',
  },
  empty: {
    backgroundColor: '#f1f5f9',
  },
  text: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
  },
});
