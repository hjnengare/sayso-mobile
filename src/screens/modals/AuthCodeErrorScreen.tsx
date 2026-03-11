import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Typography';
import { routes } from '../../navigation/routes';

type Params = { error?: string };

export default function AuthCodeErrorScreen() {
  const router = useRouter();
  const { error } = useLocalSearchParams<Params>();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={44} color="#722F37" />
        </View>
        <Text style={styles.title}>Authentication Error</Text>
        <Text style={styles.description}>
          {error || 'The sign-in callback did not complete correctly.'}
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace(routes.login() as never)}>
          <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E0E5' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(114,47,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.18)',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(45,45,45,0.68)',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#722F37',
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
