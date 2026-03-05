import { useQuery } from '@tanstack/react-query';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

type BusinessEventApiItem = {
  id?: string | number | null;
  title?: string | null;
  type?: 'event' | 'special' | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  icon?: string | null;
  price?: number | string | null;
  businessId?: string | null;
  bookingUrl?: string | null;
  bookingContact?: string | null;
  image?: string | null;
  image_url?: string | null;
  uploaded_images?: string[] | null;
};

type BusinessEventsResponse =
  | BusinessEventApiItem[]
  | {
      data?: BusinessEventApiItem[];
      items?: BusinessEventApiItem[];
      events?: BusinessEventApiItem[];
    };

function normalizeEventItem(item: BusinessEventApiItem): EventSpecialListItemDto | null {
  if (!item.id || !item.title) {
    return null;
  }

  const normalizedType = item.type === 'special' ? 'special' : 'event';

  return {
    id: String(item.id),
    title: item.title,
    type: normalizedType,
    location: item.location ?? 'Cape Town',
    description: item.description ?? undefined,
    icon: item.icon ?? undefined,
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? undefined,
    startDateISO: item.startDate ?? undefined,
    endDateISO: item.endDate ?? undefined,
    price: item.price != null ? String(item.price) : undefined,
    bookingUrl: item.bookingUrl ?? undefined,
    bookingContact: item.bookingContact ?? undefined,
    image: item.image ?? undefined,
    image_url: item.image_url ?? undefined,
    uploaded_images: Array.isArray(item.uploaded_images) ? item.uploaded_images : undefined,
    businessId: item.businessId ?? undefined,
  };
}

export function useBusinessEvents(businessId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['business-events', businessId],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const payload = await apiFetch<BusinessEventsResponse>(`/api/businesses/${businessId}/events`);
      const rows = Array.isArray(payload)
        ? payload
        : payload.items ?? payload.data ?? payload.events ?? [];
      return rows.map(normalizeEventItem).filter((item): item is EventSpecialListItemDto => Boolean(item));
    },
    staleTime: 30_000,
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
