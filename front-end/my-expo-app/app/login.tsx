import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import Input from '@/components/base/input';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';

export default function LoginScreen() {
  const authContext = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  async function handleSubmit() {
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

          <Input
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />

          <Button
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitButton}
          >
            Enter
          </Button>

          <Link href="/register" style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Don't have an account?{' '}
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
