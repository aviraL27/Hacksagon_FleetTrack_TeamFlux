const INDIA_TIME_ZONE = 'Asia/Kolkata';

const shortDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: INDIA_TIME_ZONE,
});

const clockFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: INDIA_TIME_ZONE,
});

export function formatShortDate(value = new Date()) {
  return shortDateFormatter.format(new Date(value));
}

export function formatLoggedAt(value = new Date()) {
  return `${clockFormatter.format(new Date(value))} IST`;
}

export function formatRelativeTime(value = new Date()) {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - target) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  return formatShortDate(value);
}
