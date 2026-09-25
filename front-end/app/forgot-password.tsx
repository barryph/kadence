import { useState } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, Link } from 'expo-router';
import { authAPI } from '@/api/api.auth';
import { useAuth } from '@/context/auth-context';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import AlertSuccess from '@/components/alerts/alert-success';
import KBAvoidingView from '@/components/kb-avoiding-view';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/components/auth/auth-schemas';
import { Colors, Spacing } from '@/constants/theme';

const SUCCESS_MESSAGE =
  "If an account with that email exists, a password reset link has been sent to your email address. If you don't see the email, check your spam folder.";

export default function ForgotPasswordScreen() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // A signed-in user has no reason to request a reset link. The guard lives on
  // the screen so it cannot misjudge another route: `AuthProvider` holds this
  // screen back until the session restore finishes.
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function onSubmit({ email }: ForgotPasswordFormValues) {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const response = await authAPI.forgotPassword({ email });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage(SUCCESS_MESSAGE);
    setIsLoading(false);
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
            Forgot Password
          </ThemedText>

          {errorMessage && <AlertError>{errorMessage}</AlertError>}
          {successMessage && <AlertSuccess>{successMessage}</AlertSuccess>}

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                placeholder="Email"
                value={field.value}
                onChangeText={field.onChange}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                errorMessage={fieldState.error?.message}
                editable={!isLoading && !successMessage}
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            disabled={!!successMessage}
            style={styles.submitButton}
          >
            Send Reset Link
          </Button>

          <Link href="/login" style={styles.linkContainer}>
            <ThemedText
              variant="bodySmall"
              font="system"
              style={styles.linkText}
            >
              Remember your password?{' '}
              <ThemedText
                variant="bodySmall"
                font="system"
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
