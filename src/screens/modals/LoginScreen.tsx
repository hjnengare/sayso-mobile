import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { Text, TextInput } from '../../components/Typography';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword, signInWithGoogle } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithPassword(email, password);
      router.replace(routes.home() as never);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      router.replace(routes.home() as never);
    } catch (error) {
      Alert.alert('Google sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Access your saved places, messages, and reviews.</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handlePasswordLogin}
          disabled={isSubmitting}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing in...' : 'Continue'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={isSubmitting}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(routes.forgotPassword() as never)}>
          <Text style={styles.link}>Forgot your password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(routes.register() as never)}>
          <Text style={styles.link}>Create a new account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E0E5' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6B7280', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    padding: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F4F4F4',
    borderRadius: 999,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    marginTop: 8,
    color: '#2563EB',
    fontWeight: '600',
  },
});
