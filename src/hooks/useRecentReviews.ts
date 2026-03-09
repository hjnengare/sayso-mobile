import { useQuery } from '@tanstack/react-query';
import type { RecentReviewDto, RecentReviewsResponseDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

export function useRecentReviews(limit = 10, enabled = true) {
  const query = useQuery({
    queryKey: ['recent-reviews', limit],
    enabled,
    queryFn: () => apiFetch<RecentReviewsResponseDto>(`/api/reviews/recent?limit=${limit}`),
    staleTime: 90_000,
  });

  return {
    reviews: query.data?.reviews ?? ([] as RecentReviewDto[]),
    isLoading: enabled && query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
