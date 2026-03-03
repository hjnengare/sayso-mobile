import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { Providers } from '../src/providers/Providers';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: 'Urbanist_700Bold' },
          headerBackTitleStyle: { fontFamily: 'Urbanist_500Medium' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="role-unsupported" options={{ headerShown: false }} />
        <Stack.Screen name="business/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="business/[id]/review" options={{ headerShown: true }} />
      </Stack>
    </Providers>
  );
}
