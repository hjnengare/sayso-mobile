import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { BusinessListItemDto } from '@sayso/contracts';

type Params = {
  query: string;
  minRating?: number | null;
  radiusKm?: number | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
};

interface SearchResponse {
  businesses?: BusinessListItemDto[];
  data?: BusinessListItemDto[];
}

export function useBusinessSearch({ query, minRating, radiusKm, lat, lng, limit = 50 }: Params) {
  const normalized = query.trim();

  const params = new URLSearchParams();
  params.set('q', normalized);
  params.set('limit', String(limit));
  if (minRating != null) params.set('min_rating', String(minRating));
  if (radiusKm != null && lat != null && lng != null) {
    params.set('radius_km', String(radiusKm));
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }

  return useQuery({
    queryKey: ['business-search', normalized, minRating ?? null, radiusKm ?? null, lat ?? null, lng ?? null],
    queryFn: () => apiFetch<SearchResponse>(`/api/businesses?${params.toString()}`),
    select: (r) => r.businesses ?? r.data ?? [],
    enabled: normalized.length >= 1,
    staleTime: 10_000,
  });
}
