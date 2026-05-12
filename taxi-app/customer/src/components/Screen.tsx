import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
}

export function Screen({ children, scroll = true }: ScreenProps) {
  if (!scroll) {
    return <SafeAreaView style={styles.safe}>{children}</SafeAreaView>;
  }

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
    padding: 16,
    gap: 14,
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
