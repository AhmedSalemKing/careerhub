import { useQuery } from '@tanstack/react-query'
import { get } from './api'
import { getCountryClient } from './market'

export type TrackVision = 'KSA' | 'EG'

export interface SalaryRange { min: number | null; max: number | null }
export interface TrackJob { title: string; titleAr: string; desc: string; salaryEG: SalaryRange; salaryKSA: SalaryRange; vision: TrackVision[] }
export interface TrackCourse { order: number; title: string; type: string; weeks: number; provider: string; language: string; courseId: string | null }
export interface TrackConsultant { id: string; name: string; avatar: string | null; sessionPrice: number | null }

/** Public, already localised track returned by GET /tracks. */
export interface Track {
  id: string
  slug: string
  name: string
  description: string
  weeks: number
  level: string
  languages: string
  coverImage: string | null
  speciality: string | null
  visionDescKSA: string | null
  visionDescEG: string | null
  vision2030: TrackVision[]
  currency: 'EGP' | 'SAR'
  skills: string[]
  jobs: TrackJob[]
  jobCount: number
  courses: TrackCourse[]
  courseCount: number
  freeItems: string[]
  country: string
}

/** The API expects EG or KSA; the site's market cookie uses EG / SA. */
/** GET /tracks/:slug adds the matching consultants and the computed session price (SAR, base currency). */
export interface TrackPackageInfo { id: string; price: number; originalPrice: number | null; discountPct: number | null; notes: string | null; courseCount: number; courseIds: string[] }
export interface TrackDetail extends Track { consultants: TrackConsultant[]; sessionPrice: number | null; package: TrackPackageInfo | null }

export const trackCountry = (): 'EG' | 'KSA' => (getCountryClient() === 'EG' ? 'EG' : 'KSA')

export async function fetchTracks(locale: string): Promise<Track[]> {
  const res = await get('/tracks', { params: { country: trackCountry(), lang: locale === 'en' ? 'en' : 'ar' } })
  const d = (res?.data as any)?.data
  return Array.isArray(d) ? d : []
}

export async function fetchTrack(slug: string, locale: string): Promise<TrackDetail | null> {
  try {
    const res = await get(`/tracks/${encodeURIComponent(slug)}`, { params: { country: trackCountry(), lang: locale === 'en' ? 'en' : 'ar' } })
    const d = (res?.data as any)?.data
    return d && d.slug ? d : null
  } catch (e: any) {
    if (e?.response?.status === 404) return null
    throw e
  }
}

export function useTracks(locale: string) {
  return useQuery({ queryKey: ['tracks', locale], queryFn: () => fetchTracks(locale), staleTime: 60_000 })
}

export function formatTrackPrice(price: number | null, currency: 'EGP' | 'SAR', locale: string): string {
  if (price == null) return ''
  const n = price.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')
  return currency === 'EGP' ? `${n} ${locale === 'ar' ? 'ج.م' : 'EGP'}` : `${n} ${locale === 'ar' ? 'ر.س' : 'SAR'}`
}

const CUR: Record<'EGP' | 'SAR', { ar: string; en: string }> = { EGP: { ar: 'ج.م', en: 'EGP' }, SAR: { ar: 'ر.س', en: 'SAR' } }

/** "8,000 – 25,000 ج.م" (or just one bound), '' when neither is set. */
export function formatSalaryRange(min: number | null, max: number | null, currency: 'EGP' | 'SAR', locale: string): string {
  const nf = locale === 'ar' ? 'ar-EG' : 'en-US'
  const cur = CUR[currency][locale === 'ar' ? 'ar' : 'en']
  if (min != null && max != null) return `${min.toLocaleString(nf)} – ${max.toLocaleString(nf)} ${cur}`
  const one = min ?? max
  return one != null ? `${one.toLocaleString(nf)} ${cur}` : ''
}

/** Overall salary range across a track's jobs for the visitor's market. */
export function trackSalarySpan(t: Pick<Track, 'jobs' | 'currency'>, locale: string): string {
  const pick = (j: TrackJob) => (t.currency === 'EGP' ? j.salaryEG : j.salaryKSA)
  const mins = t.jobs.map((j) => pick(j).min).filter((n): n is number => n != null)
  const maxs = t.jobs.map((j) => pick(j).max).filter((n): n is number => n != null)
  if (!mins.length && !maxs.length) return ''
  return formatSalaryRange(mins.length ? Math.min(...mins) : null, maxs.length ? Math.max(...maxs) : null, t.currency, locale)
}

/** Json columns may arrive as a JSON string; always get an array of objects back. */
export function parseJsonArray<T = Record<string, any>>(value: unknown): T[] {
  let v: unknown = value
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try { v = JSON.parse(v) } catch { return [] }
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) v = Object.values(v as Record<string, unknown>)
  return Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as T[]) : []
}
