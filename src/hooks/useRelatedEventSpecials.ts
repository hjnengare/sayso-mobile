import { useQuery } from '@tanstack/react-query';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

type RawRelatedItem = Partial<EventSpecialListItemDto> & {
  id?: string | null;
  title?: string | null;
  type?: 'event' | 'special' | null;
  startDateISO?: string | null;
  endDateISO?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
};

type RelatedResponse = {
  events?: RawRelatedItem[];
};

function formatDateLabel(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function normalizeRelatedItem(item: RawRelatedItem): EventSpecialListItemDto | null {
  if (!item?.id || !item?.title) {
    return null;
  }

  const startDateISO = item.startDateISO ?? undefined;
  const endDateISO = item.endDateISO ?? undefined;

  return {
    id: item.id,
    title: item.title,
    type: item.type === 'special' ? 'special' : 'event',
    image: item.image ?? undefined,
    image_url: item.image_url ?? undefined,
    uploaded_images: item.uploaded_images ?? undefined,
    heroImage: item.heroImage ?? undefined,
    bannerImage: item.bannerImage ?? undefined,
    businessImages: item.businessImages ?? undefined,
    alt: item.alt ?? undefined,
    icon: item.icon ?? undefined,
    location: item.location ?? 'Cape Town',
    rating: item.rating ?? undefined,
    reviews: item.reviews ?? undefined,
    totalReviews: item.totalReviews ?? undefined,
    startDate: item.startDate ?? (formatDateLabel(startDateISO) || 'Date TBA'),
    endDate: item.endDate ?? (formatDateLabel(endDateISO) || undefined),
    startDateISO,
    endDateISO,
    occurrences: item.occurrences ?? undefined,
    occurrencesCount: item.occurrencesCount ?? undefined,
    date_range_label: item.date_range_label ?? undefined,
    price: item.price ?? undefined,
    description: item.description ?? undefined,
    bookingUrl: item.bookingUrl ?? undefined,
    bookingContact: item.bookingContact ?? undefined,
    ctaSource: item.ctaSource ?? undefined,
    whatsappNumber: item.whatsappNumber ?? undefined,
    whatsappPrefillTemplate: item.whatsappPrefillTemplate ?? undefined,
    href: item.href ?? undefined,
    businessId: item.businessId ?? undefined,
    businessName: item.businessName ?? undefined,
    venueName: item.venueName ?? undefined,
    city: item.city ?? undefined,
    country: item.country ?? undefined,
    source: item.source ?? undefined,
    isCommunityEvent: item.isCommunityEvent ?? undefined,
    isExternalEvent: item.isExternalEvent ?? undefined,
    availabilityStatus: item.availabilityStatus ?? undefined,
  };
}

export function useRelatedEventSpecials(id: string | null | undefined, limit = 4) {
  const query = useQuery({
    queryKey: ['event-related', id, limit],
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = await apiFetch<RelatedResponse>(`/api/events-and-specials/${id}/related?limit=${limit}`);
      const rows = Array.isArray(payload.events) ? payload.events : [];
      return rows.map(normalizeRelatedItem).filter((item): item is EventSpecialListItemDto => Boolean(item));
    },
    staleTime: 30_000,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
