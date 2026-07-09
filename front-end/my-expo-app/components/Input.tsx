import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { ThemedText } from './themed-text';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
}

export default function Input({
  label,
  errorMessage,
  style,
  ...props
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label} type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null, style]}
        placeholderTextColor="#999"
        {...props}
      />
      {errorMessage && (
        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,.055)',
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff3333',
  },
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 14,
  },
});
