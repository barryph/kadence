import React from 'react';
import { View, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';
import Label from '@/components/base/label';
import InputErrorMessage from '@/components/base/input-error-message.tsx';
import { ThemedText } from './themed-text';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  required?: boolean;
}

export default function Input({
  label,
  errorMessage,
  style,
  required = false,
  ...props
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label}
          {required && (
            <ThemedText style={{ color: Colors.required }}>*</ThemedText>
          )}
        </Label>
      )}
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null, style]}
        placeholderTextColor="#999"
        {...props}
      />
      {errorMessage && <InputErrorMessage>{errorMessage}</InputErrorMessage>}
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
    backgroundColor: Colors.dark.inputBackground,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff3333',
  },
});
