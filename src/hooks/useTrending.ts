import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { BusinessListItemDto } from '@sayso/contracts';

interface TrendingResponse {
  businesses: BusinessListItemDto[];
  meta: { count: number; refreshedAt?: string; category?: string };
}

export function useTrending(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['trending', limit],
    queryFn: () => apiFetch<TrendingResponse>(`/api/trending?limit=${limit}`),
    enabled,
    staleTime: 90_000,
  });
}
