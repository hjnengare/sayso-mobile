import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

type RsvpResponse = {
  count?: number;
  userRsvpd?: boolean;
  isGoing?: boolean;
};

export function useEventRsvp(id: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['event-rsvp', id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<RsvpResponse>(`/api/events-and-specials/${id}/rsvp`),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () => apiFetch<RsvpResponse>(`/api/events-and-specials/${id}/rsvp`, { method: 'POST' }),
    onSuccess: (next) => {
      qc.setQueryData<RsvpResponse>(['event-rsvp', id], {
        count: next.count ?? 0,
        userRsvpd: Boolean(next.isGoing ?? next.userRsvpd),
      });
    },
  });

  return {
    count:
      typeof query.data?.count === 'number' && Number.isFinite(query.data.count)
        ? query.data.count
        : 0,
    isGoing: Boolean(query.data?.userRsvpd ?? false),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isToggling: mutation.isPending,
    error:
      (mutation.error instanceof Error ? mutation.error.message : null) ??
      (query.error instanceof Error ? query.error.message : null),
    toggleRsvp: mutation.mutateAsync,
    refetch: query.refetch,
  };
}
