import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export type AppRole = 'user' | 'business_owner' | 'admin' | null;

export type ProfileState = {
  role: AppRole;
  accountRole: AppRole;
  isEmailVerified: boolean;
  /** 'interests' | 'subcategories' | 'deal-breakers' | 'complete' | null */
  onboardingStep: string | null;
  isOnboardingComplete: boolean;
};

type ProfileContextValue = {
  profileState: ProfileState | null;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const FALLBACK_PROFILE: ProfileState = {
  role: null,
  accountRole: null,
  isEmailVerified: false,
  onboardingStep: null,
  isOnboardingComplete: false,
};

function normalizeRole(r: string | null | undefined): AppRole {
  if (!r) return null;
  if (['admin', 'super_admin', 'superadmin'].includes(r)) return 'admin';
  if (['business_owner', 'business', 'owner'].includes(r)) return 'business_owner';
  if (['user', 'personal'].includes(r)) return 'user';
  return null;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'role, account_role, email_verified, onboarding_step, onboarding_completed_at, onboarding_complete'
          )
          .eq('id', userId)
          .single();

        if (error) {
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }
          // Profile not found (trigger hasn't run yet) — use fallback
          setProfileState(FALLBACK_PROFILE);
          return;
        }

        // Check email verification from both profile column and auth user metadata
        const { data: authData } = await supabase.auth.getUser();
        const emailConfirmedAt = authData?.user?.email_confirmed_at;

        setProfileState({
          role: normalizeRole(data.role),
          accountRole: normalizeRole(data.account_role),
          isEmailVerified: Boolean(data.email_verified) || Boolean(emailConfirmedAt),
          onboardingStep: (data.onboarding_step as string | null) ?? null,
          isOnboardingComplete: Boolean(data.onboarding_completed_at) || Boolean(data.onboarding_complete),
        });
        return;
      } catch {
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        } else {
          setProfileState(FALLBACK_PROFILE);
        }
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    await fetchProfile(userId);
  }, [session?.user?.id, fetchProfile]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!session?.user?.id) {
      setProfileState(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    fetchProfile(session.user.id).finally(() => {
      setIsProfileLoading(false);
    });
  }, [session?.user?.id, isAuthLoading, fetchProfile]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profileState,
      isProfileLoading: isAuthLoading || isProfileLoading,
      refreshProfile,
    }),
    [profileState, isAuthLoading, isProfileLoading, refreshProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
