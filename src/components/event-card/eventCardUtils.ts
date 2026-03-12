import type { EventSpecialListItemDto } from '@sayso/contracts';
import { ENV } from '../../lib/env';
import { routes } from '../../navigation/routes';

const SPECIAL_FOOD_KEYWORDS = [
  'food',
  'pizza',
  'meal',
  'dinner',
  'lunch',
  'breakfast',
  'brunch',
  'snack',
  'burger',
  'kitchen',
  'restaurant',
] as const;

const SPECIAL_DRINK_KEYWORDS = [
  'cocktail',
  'beer',
  'wine',
  'drink',
  'bar',
  'happy hour',
  'brew',
] as const;

const EVENT_SPORT_KEYWORDS = [
  'yoga',
  'sport',
  'fitness',
  'run',
  'park',
  'outdoor',
  'dance',
  'music',
] as const;

export type EventCountdownState = {
  show: boolean;
  status: 'upcoming' | 'live' | 'ended' | 'unknown';
  days: number;
  hours: number;
  minutes: number;
};

function getPublicOrigin() {
  try {
    const url = new URL(ENV.apiBaseUrl);
    if (url.hostname === 'sayso.co.za') {
      url.hostname = 'www.sayso.co.za';
    }
    return url.origin;
  } catch {
    return 'https://www.sayso.co.za';
  }
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${getPublicOrigin()}${trimmed}`;
  }

  return trimmed;
}

function getValidImage(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeUrl(value);
  return normalized || null;
}

function getFallbackArtwork(item: EventSpecialListItemDto) {
  const haystack = `${item.title} ${item.description ?? ''}`.toLowerCase();

  if (item.type === 'event') {
    if (haystack.includes('yoga')) {
      return `${getPublicOrigin()}/png/015-yoga.png`;
    }
    if (EVENT_SPORT_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
      return `${getPublicOrigin()}/png/033-sport.png`;
    }
    if (haystack.includes('music') || haystack.includes('concert')) {
      return `${getPublicOrigin()}/png/040-stage.png`;
    }
    return `${getPublicOrigin()}/png/022-party-people.png`;
  }

  if (SPECIAL_DRINK_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return `${getPublicOrigin()}/png/007-beer-tap.png`;
  }

  if (SPECIAL_FOOD_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return `${getPublicOrigin()}/png/031-fast-food.png`;
  }

  return `${getPublicOrigin()}/png/025-open-book.png`;
}

function tryParseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatCompactDate(start: Date, end?: Date | null) {
  const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

  if (
    !end ||
    (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    )
  ) {
    return `${dayFormatter.format(start)} ${monthFormatter.format(start)}`;
  }

  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${dayFormatter.format(start)}-${dayFormatter.format(end)} ${monthFormatter.format(start)}`;
  }

  return `${dayFormatter.format(start)} ${monthFormatter.format(start)}-${dayFormatter.format(end)} ${monthFormatter.format(end)}`;
}

export function getEventDetailHref(item: EventSpecialListItemDto) {
  return item.type === 'event' ? routes.eventDetail(item.id) : routes.specialDetail(item.id);
}

export function isFallbackEventArtwork(url: string | null | undefined) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.pathname.startsWith('/png/');
  } catch {
    return normalizeUrl(url).includes('/png/');
  }
}

export function resolveEventMediaImage(item: EventSpecialListItemDto) {
  const uploadedImage = Array.isArray(item.uploaded_images)
    ? getValidImage(item.uploaded_images[0] ?? null)
    : null;
  const image = getValidImage(item.image);
  const imageUrl = getValidImage(item.image_url);
  const heroImage = getValidImage(item.heroImage);
  const bannerImage = getValidImage(item.bannerImage);
  const businessImage = Array.isArray(item.businessImages)
    ? getValidImage(item.businessImages[0] ?? null)
    : null;

  const resolvedImage =
    uploadedImage ??
    image ??
    imageUrl ??
    heroImage ??
    bannerImage ??
    businessImage ??
    getFallbackArtwork(item);

  return {
    image: resolvedImage,
    isFallbackArtwork: isFallbackEventArtwork(resolvedImage),
  };
}

export function getEventDescription(item: EventSpecialListItemDto) {
  const trimmed = item.description?.trim();
  if (trimmed) {
    return trimmed;
  }

  return item.type === 'event'
    ? 'Join us for this exciting event!'
    : "Don't miss out on this special offer!";
}

export function normalizeEventRating(item: EventSpecialListItemDto) {
  const rawRating = typeof item.rating === 'number' && Number.isFinite(item.rating) ? item.rating : 0;
  const hasRating = rawRating > 0;
  const reviews =
    (typeof item.reviews === 'number' && Number.isFinite(item.reviews) ? item.reviews : undefined) ??
    (typeof item.totalReviews === 'number' && Number.isFinite(item.totalReviews) ? item.totalReviews : 0);

  return {
    hasRating,
    displayRating: hasRating ? rawRating : undefined,
    reviews,
  };
}

export function getDateRibbonLabel(item: EventSpecialListItemDto) {
  const explicitLabel = item.date_range_label?.trim();
  if (explicitLabel) {
    return explicitLabel;
  }

  const occurrenceStarts = Array.isArray(item.occurrences)
    ? item.occurrences
        .map((occurrence) => tryParseDate(occurrence.startDate))
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
    : [];
  const occurrenceEnds = Array.isArray(item.occurrences)
    ? item.occurrences
        .map((occurrence) => tryParseDate(occurrence.endDate ?? occurrence.startDate))
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
    : [];

  const startDate = occurrenceStarts[0] ?? tryParseDate(item.startDateISO);
  const endDate = occurrenceEnds[occurrenceEnds.length - 1] ?? tryParseDate(item.endDateISO);

  if (startDate) {
    return formatCompactDate(startDate, endDate);
  }

  if (item.startDate && item.endDate && item.startDate !== item.endDate) {
    return `${item.startDate} - ${item.endDate}`;
  }

  return item.startDate?.trim() || null;
}

export function getEventCountdownState(item: EventSpecialListItemDto): EventCountdownState {
  const startDate = tryParseDate(item.startDateISO);
  const endDate = tryParseDate(item.endDateISO ?? item.startDateISO);

  if (!startDate) {
    return {
      show: true,
      status: 'unknown',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const now = Date.now();
  const eventStart = startDate.getTime();
  const eventEnd = endDate ? endDate.getTime() : eventStart + 24 * 60 * 60 * 1000;

  if (now > eventEnd) {
    return {
      show: true,
      status: 'ended',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  if (now >= eventStart && now <= eventEnd) {
    return {
      show: true,
      status: 'live',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const diff = eventStart - now;
  if (diff <= 0) {
    return {
      show: true,
      status: 'upcoming',
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  return {
    show: true,
    status: 'upcoming',
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}
