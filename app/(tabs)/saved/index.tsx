import { Redirect } from 'expo-router';
import SavedScreen from '../../../src/screens/tabs/SavedScreen';
import { useAuthSession } from '../../../src/hooks/useSession';

export default function SavedTabRoute() {
  const { user } = useAuthSession();

  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  return <SavedScreen />;
}
