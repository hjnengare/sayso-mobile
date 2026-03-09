import { useQuery } from '@tanstack/react-query';
import type { EventSpecialListItemDto, EventsAndSpecialsResponseDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

export function useEventsSpecialsPreview(limit = 12, enabled = true) {
  const query = useQuery({
    queryKey: ['events-specials-preview', limit],
    enabled,
    queryFn: () => apiFetch<EventsAndSpecialsResponseDto>(`/api/events-and-specials?limit=${limit}`),
    staleTime: 90_000,
  });

  return {
    items: query.data?.items ?? ([] as EventSpecialListItemDto[]),
    count: query.data?.count ?? 0,
    isLoading: enabled && query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
