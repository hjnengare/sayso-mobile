import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthSession } from './useSession';

export interface UserBadgeDto {
  id: string;
  name: string;
  description?: string | null;
  icon_path?: string | null;
  badge_group?: string | null;
  earned?: boolean;
  awarded_at?: string | null;
}

interface UserBadgesResponse {
  ok?: boolean;
  badges?: UserBadgeDto[];
}

export function useUserBadges() {
  const { user, isLoading } = useAuthSession();

  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserBadgeDto[];
      const payload = await apiFetch<UserBadgesResponse>(`/api/badges/user?user_id=${user.id}`);
      const badges = payload?.badges ?? [];
      return badges.filter((badge) => badge.earned);
    },
    enabled: Boolean(user?.id) && !isLoading,
    staleTime: 60_000,
  });
}
