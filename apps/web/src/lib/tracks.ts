import { useQuery } from '@tanstack/react-query'
import { get } from './api'
import { getCountryClient } from './market'

export type TrackVision = 'KSA' | 'EG'

export interface TrackJob { title: string; desc: string; salaryMin: number | null; salaryMax: number | null; currency: string; vision: string }
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
  vision2030: TrackVision[]
  price: number | null
  currency: 'EGP' | 'SAR'
  sessionPrice: number | null
  skills: string[]
  jobs: TrackJob[]
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
