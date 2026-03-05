import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { routes } from '../navigation/routes';
import { Text } from '../components/Typography';

type CallbackParams = {
  code?: string;
  error?: string;
  error_description?: string;
};

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<CallbackParams>();

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      try {
        if (params.error || !params.code) {
          throw new Error(params.error_description || params.error || 'Missing OAuth code');
        }

        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;

        const profile = await apiFetch<{
          data?: { display_name?: string | null; username?: string | null };
        }>('/api/user/profile').catch(() => ({ data: undefined }));

        if (cancelled) return;

        const needsCompletion = !profile.data?.display_name || !profile.data?.username;
        router.replace((needsCompletion ? routes.completeProfile() : routes.home()) as never);
      } catch {
        if (!cancelled) {
          router.replace(routes.authCodeError() as never);
        }
      }
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, [params.code, params.error, params.error_description, router]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.label}>Finishing sign in...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E0E5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    fontSize: 15,
    color: '#4B5563',
  },
});
