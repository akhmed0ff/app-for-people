import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export function TopBar({
  title,
  rightLabel,
  onRightPress,
}: {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightLabel ? (
        <Pressable onPress={onRightPress ?? (() => router.back())}>
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
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
  },
  link: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '800',
  },
});
