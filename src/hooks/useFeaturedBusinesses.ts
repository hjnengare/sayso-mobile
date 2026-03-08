import { useQuery } from '@tanstack/react-query';
import type { FeaturedBusinessDto, FeaturedBusinessesResponseDto } from '@sayso/contracts';
import { ApiError, apiFetch } from '../lib/api';

type BusinessesFallbackResponse = {
  businesses?: FeaturedBusinessDto[];
  data?: FeaturedBusinessDto[];
};

export function useFeaturedBusinesses(limit = 12, region: string | null = null, enabled = true) {
  const query = useQuery({
    queryKey: ['featured-businesses', limit, region],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (region) params.set('region', region);

      let source: 'primary' | 'fallback' = 'primary';
      let payload: FeaturedBusinessesResponseDto | FeaturedBusinessDto[] | BusinessesFallbackResponse;

      try {
        payload = await apiFetch<FeaturedBusinessesResponseDto | FeaturedBusinessDto[]>(
          `/api/featured?${params.toString()}`
        );
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) {
          throw error;
        }
        source = 'fallback';
        const fallbackParams = new URLSearchParams();
        fallbackParams.set('limit', String(limit));
        fallbackParams.set('feed_strategy', 'standard');
        fallbackParams.set('sort_by', 'total_rating');
        fallbackParams.set('sort_order', 'desc');
        if (region) fallbackParams.set('location', region);
        payload = await apiFetch<BusinessesFallbackResponse>(`/api/businesses?${fallbackParams.toString()}`);
      }

      if (source === 'fallback') {
        const fallbackData = payload as BusinessesFallbackResponse;
        const fallbackList = fallbackData.businesses ?? fallbackData.data ?? [];
        return fallbackList.map((business, index) => ({
          ...business,
          badge: 'featured' as const,
          rank: business.rank ?? index + 1,
          reviewCount: business.reviewCount ?? business.reviews ?? 0,
          monthAchievement: business.monthAchievement ?? 'Featured in the community',
          description: business.description ?? 'Featured in the community',
          category: business.category ?? business.category_label ?? 'miscellaneous',
          verified: Boolean(business.verified),
        }));
      }

      if (Array.isArray(payload)) return payload;
      return payload.data ?? payload.businesses ?? [];
    },
    staleTime: 60_000,
  });

  const error = query.error as (Error & { statusCode?: number; status?: number }) | null;
  const statusCode = (error && 'status' in error && typeof error.status === 'number')
    ? error.status
    : error?.statusCode ?? null;

  return {
    featuredBusinesses: query.data ?? [],
    isLoading: enabled && query.isLoading,
    error: error?.message ?? null,
    statusCode,
    refetch: query.refetch,
  };
}
