import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

interface TopBarProps {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
}

export function TopBar({ title, rightLabel, onRightPress }: TopBarProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightLabel ? (
        <Pressable onPress={onRightPress ?? (() => router.push('/history'))}>
          <Text style={styles.link}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  link: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
  },
});
