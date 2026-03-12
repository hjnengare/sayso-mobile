import { Redirect } from 'expo-router';
import { routes } from '../src/navigation/routes';
import { useAuth } from '../src/providers/AuthProvider';

export default function IndexScreen() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;

  return <Redirect href={(session ? routes.home() : routes.onboarding()) as never} />;
}
