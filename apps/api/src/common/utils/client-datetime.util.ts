/**
 * Helpers for turning date/time values that arrive from the clients into
 * correct UTC instants.
 *
 * The dashboards send live-session schedules as plain wall-clock strings, e.g.
 * "2026-11-03T20:00" (from <input type="datetime-local"> / "YYYY-MM-DDTHH:mm").
 * Those strings carry no timezone, so `new Date(str)` interprets them with the
 * *server's* timezone. The API host runs in UTC, which made a session the
 * instructor scheduled for 20:00 (Cairo) get stored as 20:00Z — three hours
 * after the real Cairo time, which is exactly what the UI then displayed.
 *
 * The platform schedules and displays live sessions in Egyptian local time, so
 * naive strings are resolved against Africa/Cairo (DST aware) instead of the
 * ambient server timezone. Values that already carry an explicit offset or "Z"
 * are respected as-is, so nothing that is already correct changes.
 */

export const LIVE_TIME_ZONE = 'Africa/Cairo';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LIVE_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Offset (ms) of Africa/Cairo relative to UTC at the given instant. */
function cairoOffsetMs(at: Date): number {
  const parts: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(at)) {
    parts[part.type] = part.value;
  }
  // Intl can render midnight as "24" with hour12:false in some engines.
  const hour = Number(parts.hour) % 24;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - at.getTime();
}

/** True when the string carries its own UTC offset ("Z" or "+02:00"). */
function hasExplicitOffset(value: string): boolean {
  if (/(?:Z|z)$/.test(value)) return true;
  // e.g. 2026-11-03T20:00+02:00 or 2026-11-03T20:00:00-0500
  return /(?:[+-]\d{2}:?\d{2})$/.test(value.replace(/^\d{4}-\d{2}-\d{2}T/, ''));
}

/**
 * Parses a client-supplied date/time.
 *
 * - "2026-11-03T20:00" (naive)  -> 20:00 Africa/Cairo converted to UTC
 * - "2026-11-03T20:00:00Z" / "+02:00" -> respected verbatim
 * - Date instances are passed through untouched
 * - "2026-11-03" (date only)    -> midnight Africa/Cairo of that day
 *
 * Returns `null` for missing/invalid input so callers can keep using the same
 * `if (dto.liveStartTime)` guards as before.
 */
export function parseClientDateTime(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (hasExplicitOffset(raw)) {
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?/,
  );
  if (!match) {
    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
  const wallClock = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  if (isNaN(wallClock)) return null;

  // Two-pass offset resolution so the value stays correct across DST changes.
  let utc = wallClock - cairoOffsetMs(new Date(wallClock));
  utc = wallClock - cairoOffsetMs(new Date(utc));
  return new Date(utc);
}
