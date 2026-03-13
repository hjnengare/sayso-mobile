import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { ProfileProvider } from './ProfileProvider';
import { NotificationsProvider } from './NotificationsProvider';
import { SecurityProvider } from './SecurityProvider';
import { ScrollToTopProvider } from './ScrollToTopProvider';
import { FiltersProvider } from './FiltersProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SecurityProvider>
          <AuthProvider>
            <ProfileProvider>
              <NotificationsProvider>
                <FiltersProvider>
                  <ScrollToTopProvider>{children}</ScrollToTopProvider>
                </FiltersProvider>
              </NotificationsProvider>
            </ProfileProvider>
          </AuthProvider>
        </SecurityProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
