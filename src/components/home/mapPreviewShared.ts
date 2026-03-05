import type { BusinessListItemDto } from '@sayso/contracts';
import { apiFetch } from '../../lib/api';

export type MapCenter = {
  lat: number;
  lng: number;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type NearbyApiPin = {
  id?: string | number | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
};

type TrendingNearbyResponse =
  | NearbyApiPin[]
  | {
      items?: NearbyApiPin[];
      data?: NearbyApiPin[];
      businesses?: NearbyApiPin[];
    };

type NearbyBusinessesResponse = {
  businesses?: BusinessListItemDto[];
  data?: BusinessListItemDto[];
};

type TrendingResponse =
  | BusinessListItemDto[]
  | {
      items?: BusinessListItemDto[];
      businesses?: BusinessListItemDto[];
      data?: BusinessListItemDto[];
    };

export type MapOverlayMode = 'web-custom-pin' | 'default-pin' | 'none';

export const CAPE_TOWN_CENTER: MapCenter = {
  lat: -33.9249,
  lng: 18.4241,
};

export const MAP_PREVIEW_WIDTH = 960;
export const MAP_PREVIEW_HEIGHT = 480;
export const MAP_ZOOM = 12;
export const MAX_PINS = 6;
export const MAP_QUERY_STALE_TIME_MS = 60_000;
export const MAP_LATITUDE_DELTA = 0.075;
export const MAP_LONGITUDE_DELTA = 0.11;

export const MAPBOX_ACCESS_TOKEN = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '').trim();
export const MAPBOX_WEB_PIN_URL = (process.env.EXPO_PUBLIC_MAPBOX_WEB_PIN_URL || '').trim();

function isCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toFixedCoordinate(value: number) {
  return value.toFixed(5);
}

function normalizePinRecord(record: NearbyApiPin, fallbackIndex: number): MapPin | null {
  const lat = isCoordinate(record.latitude) ? record.latitude : isCoordinate(record.lat) ? record.lat : null;
  const lng = isCoordinate(record.longitude) ? record.longitude : isCoordinate(record.lng) ? record.lng : null;

  if (!isCoordinate(lat) || !isCoordinate(lng)) {
    return null;
  }

  const idValue =
    typeof record.id === 'string' && record.id.trim().length > 0
      ? record.id
      : typeof record.id === 'number'
        ? String(record.id)
        : `map-pin-${fallbackIndex}`;

  return { id: idValue, lat, lng };
}

function dedupePins(pins: MapPin[]) {
  const deduped: MapPin[] = [];
  const seen = new Set<string>();

  for (const pin of pins) {
    const key = `${toFixedCoordinate(pin.lat)}:${toFixedCoordinate(pin.lng)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(pin);
    if (deduped.length >= MAX_PINS) {
      break;
    }
  }

  return deduped;
}

function normalizeTrendingNearbyPayload(payload: TrendingNearbyResponse) {
  const rows = Array.isArray(payload)
    ? payload
    : payload.items ?? payload.data ?? payload.businesses ?? [];

  const normalized: MapPin[] = [];
  rows.forEach((row, index) => {
    const pin = normalizePinRecord(row, index);
    if (pin) {
      normalized.push(pin);
    }
  });

  return dedupePins(normalized);
}

function normalizeBusinessesPayload(payload: NearbyBusinessesResponse) {
  const rows = payload.businesses ?? payload.data ?? [];
  const normalized: MapPin[] = [];

  rows.forEach((row, index) => {
    const pin = normalizePinRecord(
      {
        id: row.id,
        lat: row.lat ?? null,
        lng: row.lng ?? null,
      },
      index
    );

    if (pin) {
      normalized.push(pin);
    }
  });

  return dedupePins(normalized);
}

function buildStaticOverlaySegment(pins: MapPin[], mode: MapOverlayMode) {
  if (pins.length === 0 || mode === 'none') {
    return '';
  }

  if (mode === 'web-custom-pin' && MAPBOX_WEB_PIN_URL) {
    const encodedPinUrl = encodeURIComponent(MAPBOX_WEB_PIN_URL);
    return (
      pins
        .map((pin) => `url-${encodedPinUrl}(${toFixedCoordinate(pin.lng)},${toFixedCoordinate(pin.lat)})`)
        .join(',') + '/'
    );
  }

  return (
    pins
      .map((pin) => `pin-s+722F37(${toFixedCoordinate(pin.lng)},${toFixedCoordinate(pin.lat)})`)
      .join(',') + '/'
  );
}

export function buildMapboxStaticUrl(center: MapCenter, pins: MapPin[], mode: MapOverlayMode) {
  const overlay = buildStaticOverlaySegment(pins, mode);
  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${overlay}${toFixedCoordinate(center.lng)},${toFixedCoordinate(center.lat)},${MAP_ZOOM}/` +
    `${MAP_PREVIEW_WIDTH}x${MAP_PREVIEW_HEIGHT}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
  );
}

export function buildNativeMapboxTileUrl() {
  if (!MAPBOX_ACCESS_TOKEN) {
    return null;
  }

  return (
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/' +
    '{z}/{x}/{y}@2x?access_token=' +
    MAPBOX_ACCESS_TOKEN
  );
}

export function getMapRegion(center: MapCenter): MapRegion {
  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: MAP_LATITUDE_DELTA,
    longitudeDelta: MAP_LONGITUDE_DELTA,
  };
}

export async function fetchTrendingNearbyPins(center: MapCenter) {
  // Mirror web /trending-now map-tab data source first.
  try {
    const trending = await apiFetch<TrendingResponse>('/api/trending?limit=50');
    const rows = Array.isArray(trending) ? trending : trending.items ?? trending.businesses ?? trending.data ?? [];
    const normalized: MapPin[] = [];

    rows.forEach((row, index) => {
      const pin = normalizePinRecord(
        {
          id: row.id,
          latitude: (row as { latitude?: number | null }).latitude ?? null,
          longitude: (row as { longitude?: number | null }).longitude ?? null,
          lat: row.lat ?? null,
          lng: row.lng ?? null,
        },
        index
      );
      if (pin) {
        normalized.push(pin);
      }
    });

    const deduped = dedupePins(normalized);
    if (deduped.length > 0) {
      return deduped;
    }
  } catch {
    // Fall through to nearby endpoint fallback.
  }

  const nearbyParams = new URLSearchParams();
  nearbyParams.set('lat', String(center.lat));
  nearbyParams.set('lng', String(center.lng));
  nearbyParams.set('limit', String(MAX_PINS));

  try {
    const trendingNearby = await apiFetch<TrendingNearbyResponse>(`/api/trending-nearby?${nearbyParams.toString()}`);
    const normalized = normalizeTrendingNearbyPayload(trendingNearby);
    if (normalized.length > 0) {
      return normalized;
    }
  } catch {
    // Fallback handled below.
  }

  const fallbackParams = new URLSearchParams();
  fallbackParams.set('lat', String(center.lat));
  fallbackParams.set('lng', String(center.lng));
  fallbackParams.set('limit', String(MAX_PINS));
  fallbackParams.set('sort_by', 'distance');
  fallbackParams.set('sort_order', 'asc');
  fallbackParams.set('feed_strategy', 'standard');

  const fallbackResponse = await apiFetch<NearbyBusinessesResponse>(`/api/businesses?${fallbackParams.toString()}`);
  return normalizeBusinessesPayload(fallbackResponse);
}
