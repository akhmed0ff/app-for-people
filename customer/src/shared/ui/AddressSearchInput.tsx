import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchAddress } from '../../features/geocoding/geocoding.service';
import { AddressSuggestion } from '../api/types';

type AddressSearchInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  onClear: () => void;
  inline?: boolean;
};

export function AddressSearchInput({
  label,
  placeholder,
  value,
  onSelect,
  onClear,
  inline = false,
}: AddressSearchInputProps) {
  const [text, setText] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestId = useRef(0);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    const query = text.trim();
    setTouched(query.length > 0);
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = lastRequestId.current + 1;
    lastRequestId.current = requestId;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      searchAddress(query)
        .then((items) => {
          if (lastRequestId.current !== requestId) return;
          setSuggestions(items);
          setError(items.length === 0 ? 'Ничего не найдено' : null);
        })
        .catch((searchError) => {
          if (lastRequestId.current !== requestId) return;
          setSuggestions([]);
          setError(getSearchErrorText(searchError));
        })
        .finally(() => {
          if (lastRequestId.current === requestId) setLoading(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);

  function clear() {
    setText('');
    setSuggestions([]);
    setError(null);
    setTouched(false);
    onClear();
  }

  function select(suggestion: AddressSuggestion) {
    setText(suggestion.fullAddress);
    setSuggestions([]);
    setError(null);
    onSelect(suggestion);
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, inline && styles.inputRowInline]}>
        <TextInput
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          style={[styles.input, inline && styles.inputInline]}
          value={text}
        />
        {text ? (
          <Pressable accessibilityRole="button" onPress={clear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? <Text style={styles.stateText}>Ищем адрес...</Text> : null}
      {!loading && error && touched ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      {!loading && suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.id}
              onPress={() => select(suggestion)}
              style={styles.suggestion}
            >
              <Text style={styles.suggestionTitle}>{suggestion.name}</Text>
              <Text style={styles.suggestionMeta}>{suggestion.fullAddress}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getSearchErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'MAPBOX_TOKEN_MISSING') return 'Mapbox token не настроен';
  if (message === 'MAPBOX_RATE_LIMIT') return 'Слишком много запросов';
  return 'Не удалось загрузить адреса';
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { color: '#344054', fontSize: 13, fontWeight: '700' },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    overflow: 'hidden',
  },
  inputRowInline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 32,
  },
  input: {
    color: '#17202a',
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  inputInline: {
    fontSize: 15,
    minHeight: 32,
    paddingHorizontal: 0,
  },
  clearButton: { paddingHorizontal: 8, paddingVertical: 6 },
  clearText: { color: '#9ca3af', fontSize: 14 },
  stateText: { color: '#667085', fontSize: 12 },
  errorText: { color: '#b42318', fontSize: 12, fontWeight: '700' },
  suggestions: {
    backgroundColor: '#ffffff',
    borderColor: '#d9dee7',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestion: {
    borderBottomColor: '#edf1f7',
    borderBottomWidth: 1,
    gap: 2,
    padding: 12,
  },
  suggestionTitle: { color: '#17202a', fontSize: 15, fontWeight: '700' },
  suggestionMeta: { color: '#667085', fontSize: 12 },
});
