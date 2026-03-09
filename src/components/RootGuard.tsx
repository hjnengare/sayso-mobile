import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { useProfile } from '../providers/ProfileProvider';
import { routes } from '../navigation/routes';

// ─────────────────────────────────────────────────────────────────────────────
// Route classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes that are ONLY for unauthenticated users.
 * Fully-onboarded users landing here are redirected to /home.
 */
const UNAUTHENTICATED_ONLY_ROUTES = [
  '/onboarding',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Routes that carry auth context but bypass role/onboarding enforcement.
 * (callback exchanges, error recovery screens)
 */
const AUTH_BRIDGE_ROUTES = ['/verify-email', '/auth/callback', '/role-unsupported'];

/**
 * Onboarding step routes — freely navigable while onboarding is in progress.
 */
const ONBOARDING_STEP_ROUTES = ['/interests', '/subcategories', '/deal-breakers', '/complete'];
const ONBOARDING_STEP_ORDER = {
  interests: 0,
  subcategories: 1,
  'deal-breakers': 2,
  complete: 3,
} as const;

/**
 * Routes that require an authenticated session.
 * Unauthenticated users attempting to reach these are redirected to /login.
 *
 * Everything NOT in this list is publicly browsable (mirrors web behaviour):
 * home feed, business/event/special detail, leaderboard, trending, etc.
 */
const PRIVATE_ROUTES = [
  '/notifications',
  '/dm',
  '/achievements',
  '/badges',
  '/for-you',
  '/saved',
  '/interests',
  '/subcategories',
  '/deal-breakers',
  '/complete',
];

/**
 * The own-profile tab route is private (exact match only — /profile/username
 * public profiles are browsable and start with '/profile/' so they don't match).
 */
const PRIVATE_EXACT = ['/profile'];

// ─────────────────────────────────────────────────────────────────────────────

function isMatch(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(r => pathname === r || pathname.startsWith(r + '/'));
}

function isPrivate(pathname: string): boolean {
  return (
    isMatch(pathname, PRIVATE_ROUTES) ||
    PRIVATE_EXACT.includes(pathname)
  );
}

function stepToRoute(step: string | null): string {
  switch (step) {
    case 'subcategories': return routes.subcategories();
    case 'deal-breakers': return routes.dealBreakers();
    case 'complete': return routes.completeProfile();
    default:              return routes.interests();
  }
}

function routeToOnboardingStep(pathname: string): keyof typeof ONBOARDING_STEP_ORDER | null {
  if (pathname === routes.interests() || pathname.startsWith(`${routes.interests()}/`)) {
    return 'interests';
  }
  if (pathname === routes.subcategories() || pathname.startsWith(`${routes.subcategories()}/`)) {
    return 'subcategories';
  }
  if (pathname === routes.dealBreakers() || pathname.startsWith(`${routes.dealBreakers()}/`)) {
    return 'deal-breakers';
  }
  if (pathname === routes.completeProfile() || pathname.startsWith(`${routes.completeProfile()}/`)) {
    return 'complete';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stateless routing guard — mirrors web auth/onboarding privileges exactly.
 *
 * Unauthenticated users:
 *   • Can browse all public content (home, businesses, events, leaderboard…)
 *   • Are redirected to /login only when touching a private feature
 *   • Stay on landing/auth screens freely
 *
 * Authenticated users go through role → email-verification → onboarding checks,
 * then land on /home (or resume at their correct onboarding step).
 */
export function RootGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading: isAuthLoading } = useAuth();
  const { profileState, isProfileLoading } = useProfile();

  // Prevent the same redirect from firing multiple times per pathname
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for both auth + profile to fully resolve before making any decision
    if (isAuthLoading || isProfileLoading) return;

    const isUnauthOnly     = isMatch(pathname, UNAUTHENTICATED_ONLY_ROUTES);
    const isAuthBridge     = isMatch(pathname, AUTH_BRIDGE_ROUTES);
    const isOnboardingStep = isMatch(pathname, ONBOARDING_STEP_ROUTES);

    function navigate(target: string) {
      if (target === pathname || lastRedirectRef.current === target) return;
      lastRedirectRef.current = target;
      router.replace(target as never);
    }

    // ── Case 1: No session ────────────────────────────────────────────────────
    if (!session) {
      // Block access to routes that need auth; everything else is freely browsable
      if (isPrivate(pathname)) {
        navigate(routes.login());
      }
      // Landing / auth-bridge / onboarding routes — stay where you are
      return;
    }

    // Wait until profile is resolved before making role / onboarding decisions
    if (!profileState) return;

    const effectiveRole = profileState.accountRole ?? profileState.role;

    // ── Case 2: Unsupported role ──────────────────────────────────────────────
    if (effectiveRole === 'business_owner' || effectiveRole === 'admin') {
      navigate('/role-unsupported');
      return;
    }

    // ── Case 3: Email not yet verified ───────────────────────────────────────
    if (!profileState.isEmailVerified) {
      // Allow auth-bridge and unauthenticated-only routes (ToS, privacy, etc.)
      if (!isAuthBridge && !isUnauthOnly) {
        navigate(routes.verifyEmail());
      }
      return;
    }

    // ── Case 4: Onboarding incomplete ────────────────────────────────────────
    if (!profileState.isOnboardingComplete) {
      // Prevent skip-ahead while still allowing users to revisit earlier steps.
      const expectedRoute = stepToRoute(profileState.onboardingStep);
      const expectedStep = routeToOnboardingStep(expectedRoute) ?? 'interests';
      const currentStep = routeToOnboardingStep(pathname);

      if (!currentStep) {
        navigate(expectedRoute);
        return;
      }

      if (ONBOARDING_STEP_ORDER[currentStep] > ONBOARDING_STEP_ORDER[expectedStep]) {
        navigate(expectedRoute);
      }
      return;
    }

    // ── Case 5: Fully onboarded ───────────────────────────────────────────────
    // Move logged-in, onboarded users off landing/auth/onboarding screens
    if (isUnauthOnly || isOnboardingStep) {
      navigate(routes.home());
    }
    // Auth-bridge routes (verify-email, role-unsupported) — let them sit there;
    // they'll navigate forward themselves once their state resolves.
  }, [isAuthLoading, isProfileLoading, session, profileState, pathname, router]);

  return <>{children}</>;
}
