import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type EventReminderOption = '1_day' | '2_hours';

type ReminderItem = {
  remind_before?: EventReminderOption;
  remind_at?: string;
};

type ReminderResponse = {
  reminders?: ReminderItem[];
};

function normalizeReminders(payload: ReminderResponse | undefined) {
  const reminders = Array.isArray(payload?.reminders) ? payload?.reminders : [];
  return reminders
    .map((item) => item.remind_before)
    .filter((item): item is EventReminderOption => item === '1_day' || item === '2_hours');
}

export function useEventReminder(id: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['event-reminder', id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<ReminderResponse>(`/api/events-and-specials/${id}/reminder`),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (params: {
      option: EventReminderOption;
      startDateISO: string;
      eventTitle: string;
      hasReminder: boolean;
    }) => {
      if (params.hasReminder) {
        await apiFetch<{ ok: boolean }>(
          `/api/events-and-specials/${id}/reminder?remind_before=${params.option}`,
          { method: 'DELETE' }
        );
        return { option: params.option, active: false };
      }

      await apiFetch<{ ok: boolean }>(`/api/events-and-specials/${id}/reminder`, {
        method: 'POST',
        body: JSON.stringify({
          remind_before: params.option,
          event_title: params.eventTitle,
          event_start_iso: params.startDateISO,
        }),
      });

      return { option: params.option, active: true };
    },
    onSuccess: (result) => {
      qc.setQueryData<ReminderResponse>(['event-reminder', id], (current) => {
        const active = normalizeReminders(current);
        const next = new Set(active);

        if (result.active) {
          next.add(result.option);
        } else {
          next.delete(result.option);
        }

        return {
          reminders: Array.from(next).map((option) => ({ remind_before: option })),
        };
      });
    },
  });

  const reminders = normalizeReminders(query.data);

  return {
    reminders,
    hasReminder: (option: EventReminderOption) => reminders.includes(option),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isMutating: mutation.isPending,
    error:
      (mutation.error instanceof Error ? mutation.error.message : null) ??
      (query.error instanceof Error ? query.error.message : null),
    toggleReminder: mutation.mutateAsync,
    refetch: query.refetch,
  };
}
