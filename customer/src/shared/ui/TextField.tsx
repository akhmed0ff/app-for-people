import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#98a2b3" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17202a',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
