import { useQuery } from '@tanstack/react-query';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

export type EventSpecialOccurrence = {
  id: string;
  startDateISO: string;
  endDateISO?: string;
  location?: string;
  bookingUrl?: string;
  bookingContact?: string;
};

export type EventSpecialDetail = EventSpecialListItemDto & {
  occurrencesList: EventSpecialOccurrence[];
  occurrencesCount: number;
  isExpired?: boolean;
};

type RawDetailOccurrence = {
  id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  booking_url?: string | null;
  booking_contact?: string | null;
};

type RawDetailResponse = {
  event?: EventSpecialListItemDto | null;
  special?: EventSpecialListItemDto | null;
  occurrences_list?: RawDetailOccurrence[] | null;
  occurrences?: number | null;
  isExpired?: boolean;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatDateLabel(value?: string | null) {
  const parsed = parseDate(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function normalizeOccurrences(rows: RawDetailOccurrence[] | null | undefined): EventSpecialOccurrence[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row): row is RawDetailOccurrence & { id: string; start_date: string } =>
      typeof row?.id === 'string' && typeof row?.start_date === 'string'
    )
    .map((row) => ({
      id: row.id,
      startDateISO: row.start_date,
      endDateISO: row.end_date ?? undefined,
      location: row.location ?? undefined,
      bookingUrl: row.booking_url ?? undefined,
      bookingContact: row.booking_contact ?? undefined,
    }));
}

function normalizeEventSpecialDetail(id: string, payload: RawDetailResponse): EventSpecialDetail {
  const baseItem = payload.event ?? payload.special;

  if (!baseItem) {
    throw new Error('Event or special not found.');
  }

  const occurrencesList = normalizeOccurrences(payload.occurrences_list);
  const occurrencesCount =
    typeof payload.occurrences === 'number' && Number.isFinite(payload.occurrences)
      ? payload.occurrences
      : occurrencesList.length > 0
      ? occurrencesList.length
      : baseItem.occurrencesCount ?? 1;

  const firstOccurrence = occurrencesList[0];

  const normalizedStartISO = baseItem.startDateISO ?? firstOccurrence?.startDateISO ?? undefined;
  const normalizedEndISO = baseItem.endDateISO ?? firstOccurrence?.endDateISO ?? undefined;

  return {
    ...baseItem,
    id: baseItem.id || id,
    type: baseItem.type === 'special' ? 'special' : 'event',
    startDateISO: normalizedStartISO,
    endDateISO: normalizedEndISO,
    startDate: baseItem.startDate || formatDateLabel(normalizedStartISO) || 'Date TBA',
    endDate: baseItem.endDate || formatDateLabel(normalizedEndISO) || undefined,
    occurrencesCount,
    occurrences: (baseItem.occurrences ?? []).length > 0 ? baseItem.occurrences : occurrencesList.map((row) => ({
      startDate: row.startDateISO,
      endDate: row.endDateISO,
      bookingUrl: row.bookingUrl,
    })),
    occurrencesList,
    isExpired: Boolean(payload.isExpired),
  };
}

function getErrorStatus(error: Error | null) {
  if (!error) return null;
  const match = error.message.match(/^HTTP\s+(\d{3})/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useEventSpecialDetail(id: string | null | undefined) {
  const query = useQuery({
    queryKey: ['event-special-detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = await apiFetch<RawDetailResponse>(`/api/events-and-specials/${id}`);
      return normalizeEventSpecialDetail(id!, payload);
    },
    staleTime: 60_000,
  });

  const error = query.error instanceof Error ? query.error : null;

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: error?.message ?? null,
    errorStatus: getErrorStatus(error),
    refetch: query.refetch,
  };
}
