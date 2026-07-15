import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import {
  loginSchema,
  type LoginFormValues,
} from '@/components/auth/auth-schemas';

// TODO: Implement OAuth for both google and apple
//   Expo recommends using separate packages for each provider. They have video guides for both here:
//   https://docs.expo.dev/develop/authentication/#custom-oauth-with-expo-api-routes

export default function LoginScreen() {
  const authContext = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit({ email, password }: LoginFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await authContext.login(email, password);
    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    // AuthContext and RootLayout will handle redirect to tabs,
    // but we can manually push to root if we want.
    router.replace('/');
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
            Login!
          </ThemedText>

          {errorMessage && <AlertError>{errorMessage}</AlertError>}

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
                keyboardType="email-address"
                errorMessage={fieldState.error?.message}
                editable={!isLoading}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Password"
                placeholder="Password"
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
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
            Enter
          </Button>

          <Link href="/forgot-password" style={styles.linkContainer}>
            <Text style={styles.linkText}>
              <Text style={styles.linkTextBold}>Forgot Password?</Text>
            </Text>
          </Link>

          <Link href="/register" style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Don&apos;t have an account?{' '}
              <Text style={styles.linkTextBold}>Sign Up</Text>
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
