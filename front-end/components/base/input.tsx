import React from 'react';
import { View, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { FONT_SIZE } from '@/constants/typography';
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
          {required && <ThemedText style={styles.requiredMark}>*</ThemedText>}
        </Label>
      )}
      <TextInput
        style={[styles.input, errorMessage ? styles.inputError : null, style]}
        placeholderTextColor={Colors.textMuted}
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
  requiredMark: {
    color: Colors.dangerText,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FONT_SIZE.lg,
    backgroundColor: Colors.surfaceTranslucent,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.dangerText,
  },
});
