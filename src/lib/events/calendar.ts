import type { EventSpecialListItemDto } from '@sayso/contracts';

function toGoogleDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildFallbackEnd(startISO?: string) {
  if (!startISO) return null;
  const parsed = new Date(startISO);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getTime() + 2 * 60 * 60 * 1000).toISOString();
}

export function buildGoogleCalendarUrl(item: EventSpecialListItemDto) {
  const start = toGoogleDate(item.startDateISO);
  const end = toGoogleDate(item.endDateISO) ?? toGoogleDate(buildFallbackEnd(item.startDateISO) ?? undefined);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: start && end ? `${start}/${end}` : '',
    details: item.description ?? '',
    location: item.location ?? '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
