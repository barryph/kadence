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
import { Colors, Spacing } from '@/constants/theme';

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
      // Explicit role so assistive tech announces these as buttons rather than
      // as unlabelled touchables. Callers can still override it via props.
      accessibilityRole="button"
      {...props}
      style={[
        styles.button,
        disabled || isLoading ? styles.buttonDisabled : null,
        style,
      ]}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <ThemedText style={textStyle} variant="bodyStrong">
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: Spacing['4xl'],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: Colors.accentSoft,
  },
});
