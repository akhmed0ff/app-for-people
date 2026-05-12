import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ label, onPress, disabled, variant = 'primary' }: ButtonProps) {
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant !== 'primary' && styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: '#1d4ed8' },
  secondary: { backgroundColor: '#e0ecff' },
  danger: { backgroundColor: '#fee2e2' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  darkLabel: {
    color: '#17202a',
  },
});
