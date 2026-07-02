import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { ThemedText } from './themed-text';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function Button({ children, isLoading, style, ...props }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, props.disabled || isLoading ? styles.buttonDisabled : null, style]}
      activeOpacity={0.8}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText style={styles.text} type="defaultSemiBold">{children}</ThemedText>
      )}
    </TouchableOpacity>
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
    fontSize: 'inherit',
  },
});
