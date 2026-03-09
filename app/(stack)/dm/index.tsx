import { useAuthSession } from '../../../src/hooks/useSession';
import { PlaceholderScreen } from '../../../src/screens/shared/PlaceholderScreen';
import { routes } from '../../../src/navigation/routes';

export default function DMInboxRoute() {
  const { user } = useAuthSession();

  return (
    <PlaceholderScreen
      title="Messages"
      description={
        user
          ? 'The direct message inbox route is wired into the profile stack. Thread detail routing is already available at /dm/[threadId].'
          : 'Messages requires authentication. The route exists now so the mobile navigation tree is stable for future messaging work.'
      }
      actions={user ? [{ label: 'Open sample thread', href: routes.dmThread('sample-thread') }] : [{ label: 'Sign in', href: routes.onboarding() }]}
    />
  );
}
