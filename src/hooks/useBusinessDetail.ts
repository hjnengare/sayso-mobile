import { useQuery } from '@tanstack/react-query';
import type { BusinessPercentilesDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

type RawDescription =
  | string
  | {
      raw?: string | null;
      friendly?: string | null;
    }
  | null
  | undefined;

type BusinessStats = {
  average_rating?: number | null;
  total_reviews?: number | null;
  percentiles?: BusinessPercentilesDto | null;
};

type RawBusinessDetail = {
  id?: string | null;
  name?: string | null;
  category_label?: string | null;
  category?: string | null;
  primary_category_label?: string | null;
  primary_category_slug?: string | null;
  primary_subcategory_slug?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: RawDescription;
  image_url?: string | null;
  image?: string | null;
  uploaded_images?: string[] | null;
  images?: string[] | { url?: string | null; image_url?: string | null }[] | null;
  verified?: boolean | null;
  rating?: number | null;
  reviews?: number | null;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  slug?: string | null;
  priceRange?: string | null;
  price_range?: string | null;
  badge?: string | null;
  hours?: Record<string, string> | string | null;
  opening_hours?: Record<string, string> | string | null;
  openingHours?: Record<string, string> | string | null;
  owner_id?: string | null;
  interest_id?: string | null;
  interestId?: string | null;
  sub_interest_id?: string | null;
  subInterestId?: string | null;
  stats?: BusinessStats | null;
};

export interface BusinessDetail {
  id: string;
  name: string;
  category_label?: string;
  category?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  image_url?: string;
  verified?: boolean;
  rating?: number;
  reviews?: number;
  lat?: number;
  lng?: number;
  slug?: string;
  priceRange?: string;
  price_range?: string;
  badge?: string;
  hours?: Record<string, string> | string;
  opening_hours?: Record<string, string> | string;
  openingHours?: Record<string, string> | string;
  uploaded_images?: string[];
  images?: string[];
  owner_id?: string;
  interest_id?: string;
  interestId?: string;
  sub_interest_id?: string;
  subInterestId?: string;
  primary_category_slug?: string;
  primary_subcategory_slug?: string;
  stats?: {
    average_rating?: number;
    total_reviews?: number;
    percentiles?: BusinessPercentilesDto;
  };
}

function normalizeDescription(raw: RawDescription, category: string | undefined, location: string | undefined) {
  if (!raw) {
    return `${category ?? 'Business'} located in ${location ?? 'Cape Town'}`;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : `${category ?? 'Business'} located in ${location ?? 'Cape Town'}`;
  }

  const preferred = raw.friendly ?? raw.raw ?? '';
  const trimmed = preferred.trim();
  return trimmed.length > 0 ? trimmed : `${category ?? 'Business'} located in ${location ?? 'Cape Town'}`;
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeImages(raw: RawBusinessDetail) {
  const imageSet = new Set<string>();

  const addIfValid = (value: string | null | undefined) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    imageSet.add(trimmed);
  };

  if (Array.isArray(raw.uploaded_images)) {
    raw.uploaded_images.forEach((image) => addIfValid(image));
  }

  if (Array.isArray(raw.images)) {
    raw.images.forEach((image) => {
      if (typeof image === 'string') {
        addIfValid(image);
        return;
      }
      addIfValid(image.url ?? image.image_url ?? undefined);
    });
  }

  addIfValid(raw.image_url);
  addIfValid(raw.image);

  return Array.from(imageSet);
}

function normalizeBusinessDetail(raw: RawBusinessDetail, fallbackId: string): BusinessDetail {
  const images = normalizeImages(raw);
  const primaryCategory = raw.category_label ?? raw.primary_category_label ?? raw.category ?? undefined;
  const location = raw.location ?? undefined;
  const statsAverageRating = toNumber(raw.stats?.average_rating);
  const statsTotalReviews = toNumber(raw.stats?.total_reviews);
  const rating = toNumber(raw.rating) ?? statsAverageRating;
  const reviews = toNumber(raw.reviews) ?? statsTotalReviews;
  const lat = toNumber(raw.lat) ?? toNumber(raw.latitude);
  const lng = toNumber(raw.lng) ?? toNumber(raw.longitude);

  return {
    id: raw.id ?? fallbackId,
    name: raw.name?.trim() || 'Unnamed Business',
    category_label: raw.category_label ?? raw.primary_category_label ?? undefined,
    category: raw.category ?? undefined,
    primary_category_slug: raw.primary_category_slug ?? undefined,
    primary_subcategory_slug: raw.primary_subcategory_slug ?? undefined,
    location,
    address: raw.address ?? undefined,
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    website: raw.website ?? undefined,
    description: normalizeDescription(raw.description, primaryCategory, location),
    image_url: raw.image_url ?? undefined,
    verified: Boolean(raw.verified),
    rating,
    reviews,
    lat,
    lng,
    slug: raw.slug ?? undefined,
    priceRange: raw.priceRange ?? raw.price_range ?? undefined,
    price_range: raw.price_range ?? raw.priceRange ?? undefined,
    badge: raw.badge ?? undefined,
    hours: raw.hours ?? undefined,
    opening_hours: raw.opening_hours ?? undefined,
    openingHours: raw.openingHours ?? undefined,
    uploaded_images: Array.isArray(raw.uploaded_images) ? raw.uploaded_images.filter(Boolean) : [],
    images,
    owner_id: raw.owner_id ?? undefined,
    interest_id: raw.interest_id ?? undefined,
    interestId: raw.interestId ?? undefined,
    sub_interest_id: raw.sub_interest_id ?? undefined,
    subInterestId: raw.subInterestId ?? undefined,
    stats: {
      average_rating: statsAverageRating,
      total_reviews: statsTotalReviews,
      percentiles: raw.stats?.percentiles ?? undefined,
    },
  };
}

export function useBusinessDetail(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const payload = await apiFetch<RawBusinessDetail>(`/api/businesses/${id}`);
      return normalizeBusinessDetail(payload, id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}
