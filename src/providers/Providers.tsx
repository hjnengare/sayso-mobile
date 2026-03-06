import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { NotificationsProvider } from './NotificationsProvider';
import { ScrollToTopProvider } from './ScrollToTopProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <ScrollToTopProvider>{children}</ScrollToTopProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
