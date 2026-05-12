import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    gap: 14,
    padding: 16,
  },
  section: {
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
