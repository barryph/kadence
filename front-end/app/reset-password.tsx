import { useState } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { authAPI } from '@/api/api.auth';
import { ErrorCode } from '@/api/api.types';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import KBAvoidingView from '@/components/kb-avoiding-view';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/components/auth/auth-schemas';
import { Colors, Spacing } from '@/constants/theme';

const INVALID_TOKEN_MESSAGE = 'Reset token is invalid or expired';

/**
 * Password reset links open `kadence://reset-password?token=...`. Expo Router
 * maps that scheme to this route and passes the query on to
 * `useLocalSearchParams`, both when the link launches the app and when it
 * arrives while the app runs, so no manual `Linking` listener is needed here.
 * The route is registered outside the auth gate (see `RootLayoutNav`) so the
 * single-use token is never dropped by a redirect.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
    },
  });

  const resetToken = typeof token === 'string' ? token : undefined;
  const isTokenMissing = !resetToken;

  async function onSubmit({ password }: ResetPasswordFormValues) {
    if (!resetToken) return;

    setIsLoading(true);
    setErrorMessage(null);

    const response = await authAPI.resetPassword({
      token: resetToken,
      password,
    });

    if (response.error) {
      if (response.error.code === ErrorCode.INVALID_RESET_TOKEN) {
        setErrorMessage(INVALID_TOKEN_MESSAGE);
      } else {
        setErrorMessage(response.error.message);
      }
      setIsLoading(false);
      return;
    }

    router.replace('/login');
  }

  if (isTokenMissing) {
    return (
      <KBAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Background />
          <View style={styles.formContainer}>
            <ThemedText variant="display" style={styles.title}>
              Reset Password
            </ThemedText>
            <AlertError>Reset token is missing</AlertError>
            <Link href="/login" style={styles.linkContainer}>
              <ThemedText variant="bodySmall" style={styles.linkText}>
                Back to{' '}
                <ThemedText
                  variant="bodySmall"
                  weight="700"
                  style={styles.linkEmphasis}
                >
                  Log In
                </ThemedText>
              </ThemedText>
            </Link>
          </View>
        </ScrollView>
      </KBAvoidingView>
    );
  }

  return (
    <KBAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Background />
        <View style={styles.formContainer}>
          <ThemedText variant="display" style={styles.title}>
            Reset Password
          </ThemedText>

          {errorMessage && <AlertError>{errorMessage}</AlertError>}

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="New Password"
                placeholder="New Password"
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                errorMessage={fieldState.error?.message}
                editable={!isLoading}
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={styles.submitButton}
          >
            Reset Password
          </Button>

          <Link href="/login" style={styles.linkContainer}>
            <ThemedText variant="bodySmall" style={styles.linkText}>
              Back to{' '}
              <ThemedText
                variant="bodySmall"
                weight="700"
                style={styles.linkEmphasis}
              >
                Log In
              </ThemedText>
            </ThemedText>
          </Link>
        </View>
      </ScrollView>
    </KBAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing['4xl'],
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    marginBottom: Spacing['4xl'],
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  linkContainer: {
    marginTop: Spacing['4xl'],
    alignSelf: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
  },
  linkEmphasis: {
    color: Colors.accent,
  },
});
