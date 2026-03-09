import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { ProfileProvider } from './ProfileProvider';
import { NotificationsProvider } from './NotificationsProvider';
import { SecurityProvider } from './SecurityProvider';
import { ScrollToTopProvider } from './ScrollToTopProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <AuthProvider>
          <ProfileProvider>
            <NotificationsProvider>
              <ScrollToTopProvider>{children}</ScrollToTopProvider>
            </NotificationsProvider>
          </ProfileProvider>
        </AuthProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
}
