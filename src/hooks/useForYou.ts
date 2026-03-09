import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';
import { useAuthSession } from './useSession';
import { useUserPreferences } from './useUserPreferences';

type BusinessesResponse = {
  businesses?: BusinessListItemDto[];
  data?: BusinessListItemDto[];
};

export function useForYouBusinesses(limit = 20, enabled = true) {
  const { user } = useAuthSession();
  const preferences = useUserPreferences(enabled);

  const preferenceIds = useMemo(
    () => ({
      interests: preferences.interests.map((item) => item.id),
      subcategories: preferences.subcategories.map((item) => item.id),
      dealbreakers: preferences.dealbreakers.map((item) => item.id),
    }),
    [preferences.dealbreakers, preferences.interests, preferences.subcategories]
  );

  const hasPreferences =
    preferenceIds.interests.length > 0 ||
    preferenceIds.subcategories.length > 0 ||
    preferenceIds.dealbreakers.length > 0;

  const query = useQuery({
    queryKey: ['for-you', user?.id, limit, preferenceIds],
    enabled: enabled && Boolean(user?.id) && !preferences.isLoading && hasPreferences,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('feed_strategy', 'mixed');
      if (preferenceIds.interests.length > 0) {
        params.set('interest_ids', preferenceIds.interests.join(','));
      }
      if (preferenceIds.subcategories.length > 0) {
        params.set('sub_interest_ids', preferenceIds.subcategories.join(','));
      }
      if (preferenceIds.dealbreakers.length > 0) {
        params.set('dealbreakers', preferenceIds.dealbreakers.join(','));
      }

      const response = await apiFetch<BusinessesResponse>(`/api/businesses?${params.toString()}`);
      return response.businesses ?? response.data ?? [];
    },
    staleTime: 90_000,
  });

  return {
    businesses: query.data ?? [],
    isLoading: enabled && Boolean(user?.id) && (preferences.isLoading || query.isLoading),
    error: query.error instanceof Error ? query.error.message : null,
    hasPreferences,
    refetch: async () => {
      await preferences.refetch();
      return query.refetch();
    },
  };
}
