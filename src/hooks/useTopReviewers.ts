import { useQuery } from '@tanstack/react-query';
import type { TopReviewerDto, TopReviewersResponseDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

export function useTopReviewers(limit = 12, enabled = true) {
  const query = useQuery({
    queryKey: ['top-reviewers', limit],
    enabled,
    queryFn: () => apiFetch<TopReviewersResponseDto>(`/api/reviewers/top?limit=${limit}`),
    staleTime: 120_000,
  });

  return {
    reviewers: query.data?.reviewers ?? ([] as TopReviewerDto[]),
    mode: query.data?.mode ?? ('stage1' as const),
    isLoading: enabled && query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
