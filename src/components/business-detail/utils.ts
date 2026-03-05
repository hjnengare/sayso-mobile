import type { BusinessDetail } from '../../hooks/useBusinessDetail';

const MAPBOX_ACCESS_TOKEN = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '').trim();
const CAPE_TOWN = {
  lat: -33.9249,
  lng: 18.4241,
};

export type DayHours = {
  open: string;
  close: string;
  closed?: boolean;
};

export type HoursRecord = Record<string, string | DayHours>;

export function normalizeBusinessImages(business: BusinessDetail) {
  const imageSet = new Set<string>();
  const addImage = (value: string | null | undefined) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    imageSet.add(trimmed);
  };

  business.uploaded_images?.forEach((image) => addImage(image));
  business.images?.forEach((image) => addImage(image));
  addImage(business.image_url);

  return Array.from(imageSet);
}

export function normalizeBusinessRating(business: BusinessDetail) {
  const rating =
    (typeof business.stats?.average_rating === 'number' && Number.isFinite(business.stats.average_rating)
      ? business.stats.average_rating
      : undefined) ??
    (typeof business.rating === 'number' && Number.isFinite(business.rating) ? business.rating : undefined) ??
    0;

  const reviewCount =
    (typeof business.stats?.total_reviews === 'number' && Number.isFinite(business.stats.total_reviews)
      ? business.stats.total_reviews
      : undefined) ??
    (typeof business.reviews === 'number' && Number.isFinite(business.reviews) ? business.reviews : undefined) ??
    0;

  return {
    rating,
    reviewCount,
  };
}

export function normalizeLocationText(business: BusinessDetail) {
  return business.location?.trim() || business.address?.trim() || 'Cape Town';
}

export function normalizeCategoryText(business: BusinessDetail) {
  return business.category_label?.trim() || business.category?.trim() || 'Business';
}

export function normalizeDescriptionText(business: BusinessDetail) {
  const raw = business.description;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return `${normalizeCategoryText(business)} located in ${normalizeLocationText(business)}`;
}

export function normalizePriceRange(raw: string | null | undefined) {
  if (!raw || !raw.trim()) {
    return null;
  }

  const trimmed = raw.trim();
  const dollarCount = (trimmed.match(/\$/g) || []).length;
  if (dollarCount > 0) {
    const display = 'R'.repeat(dollarCount);
    const descriptionMap: Record<number, string> = {
      1: 'Budget friendly',
      2: 'Moderate',
      3: 'Upscale',
      4: 'Luxury',
    };
    return {
      display,
      description: descriptionMap[dollarCount] ?? '',
    };
  }

  return {
    display: trimmed,
    description: '',
  };
}

export function formatTime(time: string) {
  const [hourString, minuteString] = time.split(':');
  const hours = Number.parseInt(hourString, 10);
  const minutes = Number.parseInt(minuteString ?? '0', 10);
  if (!Number.isFinite(hours)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  if (!Number.isFinite(minutes) || minutes === 0) {
    return `${displayHours} ${period}`;
  }
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function currentDayKey() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export function normalizeHours(raw: BusinessDetail['hours'] | BusinessDetail['opening_hours'] | BusinessDetail['openingHours'] | null) {
  if (!raw || typeof raw === 'string') {
    return null;
  }

  return raw as HoursRecord;
}

export function calculateOpenStatus(hoursRecord: HoursRecord | null) {
  if (!hoursRecord) {
    return {
      isOpen: false,
      status: 'Hours unavailable',
    };
  }

  const currentDay = currentDayKey();
  const today = hoursRecord[currentDay];
  if (!today) {
    return {
      isOpen: false,
      status: 'Closed today',
    };
  }

  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  if (typeof today === 'string') {
    if (today.toLowerCase() === 'closed') {
      return {
        isOpen: false,
        status: 'Closed today',
      };
    }

    const matches = today.match(/(\d{1,2}):?(\d{2})?\s*[-]\s*(\d{1,2}):?(\d{2})?/);
    if (!matches) {
      return {
        isOpen: false,
        status: today,
      };
    }
    const openHour = Number.parseInt(matches[1], 10);
    const openMinute = Number.parseInt(matches[2] || '0', 10);
    const closeHour = Number.parseInt(matches[3], 10);
    const closeMinute = Number.parseInt(matches[4] || '0', 10);
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    if (currentTimeMinutes >= openTime && currentTimeMinutes < closeTime) {
      return {
        isOpen: true,
        status: `Open until ${formatTime(`${closeHour}:${closeMinute}`)}`,
      };
    }
    if (currentTimeMinutes < openTime) {
      return {
        isOpen: false,
        status: `Opens at ${formatTime(`${openHour}:${openMinute}`)}`,
      };
    }

    return {
      isOpen: false,
      status: 'Closed',
    };
  }

  if (today.closed) {
    return {
      isOpen: false,
      status: 'Closed today',
    };
  }

  const [openHour, openMinute] = today.open.split(':').map((value) => Number.parseInt(value, 10));
  const [closeHour, closeMinute] = today.close.split(':').map((value) => Number.parseInt(value, 10));
  const openTime = openHour * 60 + (Number.isFinite(openMinute) ? openMinute : 0);
  const closeTime = closeHour * 60 + (Number.isFinite(closeMinute) ? closeMinute : 0);

  if (currentTimeMinutes >= openTime && currentTimeMinutes < closeTime) {
    return {
      isOpen: true,
      status: `Open until ${formatTime(today.close)}`,
    };
  }
  if (currentTimeMinutes < openTime) {
    return {
      isOpen: false,
      status: `Opens at ${formatTime(today.open)}`,
    };
  }

  return {
    isOpen: false,
    status: 'Closed',
  };
}

export function getHoursRows(hoursRecord: HoursRecord | null) {
  if (!hoursRecord) {
    return [];
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const labels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  const today = currentDayKey();

  return days.map((day) => {
    const hours = hoursRecord[day];
    if (!hours) {
      return {
        key: day,
        label: labels[day],
        value: 'Closed',
        isToday: day === today,
      };
    }

    if (typeof hours === 'string') {
      return {
        key: day,
        label: labels[day],
        value: hours,
        isToday: day === today,
      };
    }

    if (hours.closed) {
      return {
        key: day,
        label: labels[day],
        value: 'Closed',
        isToday: day === today,
      };
    }

    return {
      key: day,
      label: labels[day],
      value: `${formatTime(hours.open)} - ${formatTime(hours.close)}`,
      isToday: day === today,
    };
  });
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

export function buildBusinessMapPreviewUrl({
  lat,
  lng,
  width = 900,
  height = 520,
}: {
  lat?: number | null;
  lng?: number | null;
  width?: number;
  height?: number;
}) {
  if (!MAPBOX_ACCESS_TOKEN) {
    return null;
  }

  const centerLat = typeof lat === 'number' && Number.isFinite(lat) ? lat : CAPE_TOWN.lat;
  const centerLng = typeof lng === 'number' && Number.isFinite(lng) ? lng : CAPE_TOWN.lng;
  const marker = `pin-s+722F37(${formatCoordinate(centerLng)},${formatCoordinate(centerLat)})/`;

  return (
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
    `${marker}${formatCoordinate(centerLng)},${formatCoordinate(centerLat)},14/` +
    `${width}x${height}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
  );
}

export function normalizeWebsite(website?: string | null) {
  if (!website) return null;
  const trimmed = website.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizePhoneDigits(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 7 ? digits : null;
}

export function buildGoogleDirectionsUrl(name: string, latitude?: number | null, longitude?: number | null, address?: string | null) {
  if (typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  }
  const query = encodeURIComponent(`${name} ${address ?? ''}`.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function buildGoogleWalkingUrl(name: string, latitude?: number | null, longitude?: number | null, address?: string | null) {
  if (typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  }
  const query = encodeURIComponent(`${name} ${address ?? ''}`.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=walking`;
}

export function buildUberUrl(name: string, latitude?: number | null, longitude?: number | null) {
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || typeof longitude !== 'number' || !Number.isFinite(longitude)) {
    return null;
  }
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[latitude]': String(latitude),
    'dropoff[longitude]': String(longitude),
    'dropoff[nickname]': name,
  });
  return `https://m.uber.com/ul/?${params.toString()}`;
}
