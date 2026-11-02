const STEP = 30
/** Sessions shorter than this are billed for exactly what happened. */
const MIN_BILLABLE = 20
/** A session this far under its booked length still counts as the booked length. */
const UNDER_TOLERANCE = 25
/** A session less than this far over its booked length still counts as the booked length. */
const OVER_TOLERANCE = 30

/**
 * Turns the real length of a consulting session into the length it is billed
 * and reported as, so a session that ran a little short or long is not
 * penalised either way.
 *
 * For a booked length B and an actual length A (minutes):
 *   - A under 20            -> A itself (too short to round up to a package)
 *   - B-25 <= A < B+30      -> B (booked length; 35 to 89 for a 60 minute booking)
 *   - A under B-25          -> A rounded to the nearest 30, at least 30 (20 to 34 -> 30)
 *   - A at or over B+30     -> A rounded DOWN to a whole 30 (90 to 119 -> 90)
 */
export function snapDurationToPackage(actualMinutes: number, bookedMinutes: number): number {
  const actual = Math.round(actualMinutes)
  if (!Number.isFinite(actual) || actual <= 0) return Math.max(0, actual || 0)
  if (actual < MIN_BILLABLE) return actual

  const booked = bookedMinutes > 0 ? bookedMinutes : 60
  if (actual >= booked - UNDER_TOLERANCE && actual < booked + OVER_TOLERANCE) return booked
  if (actual < booked) return Math.max(STEP, Math.round(actual / STEP) * STEP)
  return Math.floor(actual / STEP) * STEP
}

/** Whole minutes between two timestamps, or null when either is missing. */
export function calculateActualDuration(startedAt: Date | null | undefined, endedAt: Date | null | undefined): number | null {
  if (!startedAt || !endedAt) return null
  return Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
}
