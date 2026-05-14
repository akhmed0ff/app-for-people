import { createElement, PropsWithChildren, ReactElement, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

type BoxProps = {
  children?: ReactNode;
  contentContainerStyle?: unknown;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  style?: unknown;
};

const SafeArea = SafeAreaView as unknown as (props: BoxProps) => ReactElement;
const Scroll = ScrollView as unknown as (props: BoxProps) => ReactElement;
const Box = View as unknown as (props: BoxProps) => ReactElement;

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  if (!scroll) {
    return createElement(SafeArea, { style: styles.screen }, children);
  }

  return createElement(
    SafeArea,
    { style: styles.screen },
    createElement(Scroll, { contentContainerStyle: styles.content, keyboardShouldPersistTaps: 'handled' }, children),
  );
}

export function Section({ children }: PropsWithChildren) {
  return createElement(Box, { style: styles.section }, children);
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
