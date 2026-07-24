import { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import KBAvoidingView from '@/components/kb-avoiding-view';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/components/auth/auth-schemas';

export default function RegisterScreen() {
  const authContext = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  async function onSubmit({
    email,
    password,
    passwordConfirm,
  }: RegisterFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await authContext.register(
      email,
      password,
      passwordConfirm,
    );
    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    // AuthContext will handle redirect to tabs,
    // but we can manually push to root if we want.
    router.replace('/');
  }

  return (
    <KBAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Background />
        <View style={styles.formContainer}>
          <ThemedText style={styles.title} type="title">
            Sign Up!
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
                errorMessage={fieldState.error?.message}
                editable={!isLoading}
              />
            )}
          />

          <Controller
            control={control}
            name="passwordConfirm"
            render={({ field, fieldState }) => (
              <Input
                label="Password Confirm"
                placeholder="Password Confirm"
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry
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

          <Link href="/login" style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkTextBold}>Log In</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KBAvoidingView>
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
