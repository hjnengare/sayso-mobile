import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BusinessListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

type HomeSearchOptions = {
  query: string;
  minRating: number | null;
  distanceKm: number | null;
  latitude: number | null;
  longitude: number | null;
  limit?: number;
};

type BusinessesResponse = {
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
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('q', normalizedQuery);
      if (minRating != null) params.set('min_rating', String(minRating));
      if (distanceKm != null && latitude != null && longitude != null) {
        params.set('radius_km', String(distanceKm));
        params.set('lat', String(latitude));
        params.set('lng', String(longitude));
      }

      const response = await apiFetch<BusinessesResponse>(`/api/businesses?${params.toString()}`);
      return response.businesses ?? response.data ?? [];
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
