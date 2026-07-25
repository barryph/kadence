import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  children,
  isLoading,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      style={[
        styles.button,
        disabled || isLoading ? styles.buttonDisabled : null,
        style,
      ]}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText style={[styles.text, textStyle]} type="defaultSemiBold">
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0072ff',
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#80b9ff',
  },
  text: {
    color: 'inherit',
  },
});
