import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { authAPI } from '@/api/api.auth';
import { ErrorCode } from '@/api/api.types';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';

const INVALID_TOKEN_MESSAGE = 'Reset token is invalid or expired';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const resetToken = typeof token === 'string' ? token : undefined;
  const isTokenMissing = !resetToken;

  async function handleSubmit() {
    if (!resetToken) return;

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setPasswordError('Password is required');
      return;
    }

    setPasswordError(null);
    setIsLoading(true);
    setErrorMessage(null);

    const response = await authAPI.resetPassword({
      token: resetToken,
      password: trimmedPassword,
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Background />
          <View style={styles.formContainer}>
            <ThemedText style={styles.title} type="title">
              Reset Password
            </ThemedText>
            <AlertError>Reset token is missing</AlertError>
            <Link href="/login" style={styles.linkContainer}>
              <Text style={styles.linkText}>
                Back to{' '}
                <Text style={styles.linkTextBold}>Log In</Text>
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Background />
        <View style={styles.formContainer}>
          <ThemedText style={styles.title} type="title">
            Reset Password
          </ThemedText>

          {errorMessage && <AlertError>{errorMessage}</AlertError>}

          <Input
            label="New Password"
            placeholder="New Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            errorMessage={passwordError ?? undefined}
            editable={!isLoading}
          />

          <Button
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
          >
            Reset Password
          </Button>

          <Link href="/login" style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Back to{' '}
              <Text style={styles.linkTextBold}>Log In</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#fff',
  },
  submitButton: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 24,
    alignSelf: 'center',
  },
  linkText: {
    color: '#ddd',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#0072ff',
    fontWeight: '700',
  },
});
