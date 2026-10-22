/**
 * Single source of truth for live-session formatting.
 *
 * Two rules every live date/time display must follow:
 *
 * 1. Force the Gregorian calendar. `toLocaleDateString('ar')` / `'ar-SA'`
 *    resolve to the Islamic (Hijri) calendar in most browsers, so the schedule
 *    shown to the instructor/student was in the wrong calendar. The locale is
 *    pinned to `ar-EG-u-ca-gregory` / `en-US-u-ca-gregory` so it can never fall
 *    back to the Hijri calendar.
 *
 * 2. Render in the browser's own timezone. The schedule is stored as a UTC
 *    instant, so the only correct wall-clock time for a viewer is the one in
 *    their own timezone — the platform is Arabic but students are not all in
 *    the same country. `Intl.DateTimeFormat().resolvedOptions().timeZone` is
 *    the browser's zone; hardcoding one zone would shift every date for
 *    everybody else.
 *
 * The wall-clock time the instructor TYPES is resolved server-side against
 * Africa/Cairo (the platform's canonical schedule timezone) so the stored
 * instant matches what was chosen; from that instant on, every client renders
 * it in its own timezone.
 */

import { browserTimeZone } from './time'

const AR_LOCALE = 'ar-EG-u-ca-gregory'
const EN_LOCALE = 'en-US-u-ca-gregory'

/**
 * The recording is produced in the instructor's browser with MediaRecorder
 * and uploaded to the platform when the stream ends, so the feature is
 * available. (It used to be switched off because no recording pipeline
 * existed at all.)
 */
export const LIVE_RECORDING_SUPPORTED = true

export const LIVE_RECORDING_NOTE_AR = 'يتم تسجيل البث تلقائياً في متصفحك، ويُحفظ بعد انتهاء البث ليتمكن المشتركون من مشاهدته'
export const LIVE_RECORDING_NOTE_EN = 'The stream is recorded automatically in your browser and saved when it ends, so your students can watch it'

export function liveRecordingNote(locale: string): string {
  return locale === 'ar' ? LIVE_RECORDING_NOTE_AR : LIVE_RECORDING_NOTE_EN
}

/** 'scheduled' | 'live' | 'ended' — never null (null means "regular recorded course"). */
export function normalizeLiveStatus(status: unknown): 'scheduled' | 'live' | 'ended' | null {
  if (typeof status !== 'string') return null
  const v = status.trim().toLowerCase()
  if (v === 'live' || v === 'scheduled' || v === 'ended') return v
  // Treat any other truthy value as a scheduled session rather than dropping it.
  return v ? 'scheduled' : null
}

export function isLiveStatus(status: unknown, expected: 'scheduled' | 'live' | 'ended'): boolean {
  return normalizeLiveStatus(status) === expected
}

function opts(locale: string, extra: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormatOptions {
  return { ...extra, timeZone: browserTimeZone(), calendar: 'gregory' }
}

function localeOf(locale?: string): string {
  return locale === 'ar' || locale?.startsWith('ar') ? AR_LOCALE : EN_LOCALE
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** "الأربعاء، 21 أكتوبر 2026 20:00" — full schedule date + time. */
export function formatLiveDateTime(value: string | number | Date | null | undefined, locale = 'en'): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString(localeOf(locale), opts(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }))
}

/** "الأربعاء، 21 أكتوبر 2026" — date only. */
export function formatLiveDate(value: string | number | Date | null | undefined, locale = 'en'): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString(localeOf(locale), opts(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }))
}

/** "21 أكتوبر 2026" — compact date. */
export function formatLiveDateShort(value: string | number | Date | null | undefined, locale = 'en'): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString(localeOf(locale), opts(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }))
}

/** "08:00 م" — wall-clock time of the session. */
export function formatLiveTime(value: string | number | Date | null | undefined, locale = 'en'): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleTimeString(localeOf(locale), opts(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }))
}

/** "21 أكتوبر، 08:00 م" — compact date + time used inside badges. */
export function formatLiveDateTimeShort(value: string | number | Date | null | undefined, locale = 'en'): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString(localeOf(locale), opts(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }))
}

/** HH:MM countdown unit string used by "starts in X h Y m". */
export function liveCountdownParts(value: string | number | Date | null | undefined) {
  const d = toDate(value)
  const diffMs = d ? d.getTime() - Date.now() : 0
  const total = Math.max(0, Math.floor(diffMs / 60000))
  return {
    isUpcoming: diffMs > 0,
    hours: Math.floor(total / 60),
    minutes: total % 60,
    days: Math.floor(total / (60 * 24)),
  }
}
