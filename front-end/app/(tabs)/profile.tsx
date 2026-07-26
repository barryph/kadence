import { StyleSheet, View } from 'react-native';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import { ThemedText } from '@/components/base/themed-text';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import { useAuth } from '@/context/auth-context';

function Profile() {
  const authContext = useAuth();
  const user = authContext.user!;

  return (
    <View style={styles.container}>
      <Background showRed={false} />
      <Container style={styles.content}>
        <ThemedText style={styles.title} type="title" size="large">
          Profile
        </ThemedText>
        <View style={styles.card}>
          <ThemedText size="small" style={styles.label}>
            Email
          </ThemedText>
          <ThemedText type="defaultBold">{user.email}</ThemedText>
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  title: {
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    paddingTop: 14,
    paddingBottom: 12,
    gap: 2,
  },
  label: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
  },
  muted: {
    opacity: 0.8,
  },
});

export default function wrapper() {
  return <Profile />;
}
