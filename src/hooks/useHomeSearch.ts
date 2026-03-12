import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BusinessListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';
import { ALGOLIA_CONFIGURED, searchBusinesses } from '../lib/algolia';

type HomeSearchOptions = {
  query: string;
  minRating: number | null;
  distanceKm: number | null;
  latitude: number | null;
  longitude: number | null;
  limit?: number;
};

type ApiSearchResponse = {
  results?: BusinessListItemDto[];
  businesses?: BusinessListItemDto[];
  data?: BusinessListItemDto[];
};

export function useHomeSearch({
  query,
  minRating,
  distanceKm,
  latitude,
  longitude,
  limit = 20,
}: HomeSearchOptions) {
  const normalizedQuery = query.trim();

  const queryResult = useQuery({
    queryKey: ['home-search', normalizedQuery, minRating, distanceKm, latitude, longitude, limit],
    enabled: normalizedQuery.length >= 2,
    queryFn: async (): Promise<BusinessListItemDto[]> => {
      // ── 1. Algolia (direct — fastest, no extra server hop) ────────────────
      if (ALGOLIA_CONFIGURED) {
        try {
          const hits = await searchBusinesses({
            query: normalizedQuery,
            minRating,
            distanceKm,
            lat: latitude,
            lng: longitude,
            limit,
          });
          if (hits && hits.length > 0) return hits as BusinessListItemDto[];
        } catch {
          // fall through to API
        }
      }

      // ── 2. /api/search (server-side Algolia → Supabase fallback) ──────────
      try {
        const params = new URLSearchParams({ q: normalizedQuery, limit: String(limit) });
        if (minRating != null) params.set('minRating', String(minRating));
        if (distanceKm != null && latitude != null && longitude != null) {
          params.set('distanceKm', String(distanceKm));
        }
        const resp = await apiFetch<ApiSearchResponse>(`/api/search?${params.toString()}`);
        if (resp.results && resp.results.length > 0) return resp.results;
      } catch {
        // fall through to businesses endpoint
      }

      // ── 3. /api/businesses (last resort) ─────────────────────────────────
      const params = new URLSearchParams({ limit: String(limit), q: normalizedQuery });
      if (minRating != null) params.set('min_rating', String(minRating));
      if (distanceKm != null && latitude != null && longitude != null) {
        params.set('radius_km', String(distanceKm));
        params.set('lat', String(latitude));
        params.set('lng', String(longitude));
      }
      const resp = await apiFetch<ApiSearchResponse>(`/api/businesses?${params.toString()}`);
      return resp.businesses ?? resp.data ?? [];
    },
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  return {
    businesses: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    error: queryResult.error instanceof Error ? queryResult.error.message : null,
    refetch: queryResult.refetch,
  };
}
