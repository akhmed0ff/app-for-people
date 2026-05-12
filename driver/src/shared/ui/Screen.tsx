import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  if (!scroll) {
    return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
  }
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Section({ children }: PropsWithChildren) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7f8fa',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
});
