import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || disabled || loading) && styles.dimmed,
      ]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#111827',
  },
  secondary: {
    backgroundColor: '#2563eb',
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  dimmed: {
    opacity: 0.65,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
