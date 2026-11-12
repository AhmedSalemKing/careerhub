import { useQuery } from '@tanstack/react-query'
import { get } from './api'
import { getCountryClient } from './market'

export type TrackVision = 'KSA' | 'EG'

export interface TrackJob { title: string; desc: string; salaryMin: number | null; salaryMax: number | null; currency: 'EGP' | 'SAR'; vision: TrackVision[] }
export interface TrackPackage { name: string; desc: string; price: number | null; currency: 'EGP' | 'SAR'; sessions: number }
export interface TrackCourse { order: number; title: string; type: string; weeks: number; provider: string; language: string }

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
  vision2030: TrackVision[]
  currency: 'EGP' | 'SAR'
  skills: string[]
  jobs: TrackJob[]
  jobCount: number
  packages: TrackPackage[]
  courses: TrackCourse[]
  courseCount: number
  freeItems: string[]
  country: string
}

/** The API expects EG or KSA; the site's market cookie uses EG / SA. */
export const trackCountry = (): 'EG' | 'KSA' => (getCountryClient() === 'EG' ? 'EG' : 'KSA')

export async function fetchTracks(locale: string): Promise<Track[]> {
  const res = await get('/tracks', { params: { country: trackCountry(), lang: locale === 'en' ? 'en' : 'ar' } })
  const d = (res?.data as any)?.data
  return Array.isArray(d) ? d : []
}

export async function fetchTrack(slug: string, locale: string): Promise<Track | null> {
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
  const mins = t.jobs.map((j) => j.salaryMin).filter((n): n is number => n != null)
  const maxs = t.jobs.map((j) => j.salaryMax).filter((n): n is number => n != null)
  if (!mins.length && !maxs.length) return ''
  return formatSalaryRange(mins.length ? Math.min(...mins) : null, maxs.length ? Math.max(...maxs) : null, t.currency, locale)
}
