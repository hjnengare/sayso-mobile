import { Redirect } from 'expo-router';
import ProfileScreen from '../../../src/screens/tabs/ProfileScreen';
import { useAuthSession } from '../../../src/hooks/useSession';

export default function ProfileTabRoute() {
  const { user } = useAuthSession();

  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  return <ProfileScreen />;
}
