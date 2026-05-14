import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.deveways.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
const locales = ['ar', 'en']

async function safeFetch(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const result = data?.data?.courses
      || data?.data?.data
      || data?.data
      || data?.courses
      || data
    return Array.isArray(result) ? result : []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '', '/courses', '/coaches', '/coaching',
    '/careers', '/pricing', '/faq', '/contact', '/help',
  ]

  const [courses, careerPaths, coaches] = await Promise.allSettled([
    safeFetch(`${API_URL}/courses?limit=100`),
    safeFetch(`${API_URL}/career/paths`),
    safeFetch(`${API_URL}/coaching/coaches`),
  ]).then(results => results.map(r =>
    r.status === 'fulfilled' ? r.value : []
  ))

  const entries: MetadataRoute.Sitemap = []

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/ar${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages: {
          ar: `${BASE_URL}/ar${page}`,
          en: `${BASE_URL}/en${page}`,
        },
      },
    })
  }

  for (const course of (courses || [])) {
    if (!course?.slug) continue
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/courses/${course.slug}`,
        lastModified: new Date(course.updatedAt || course.createdAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    }
  }

  for (const path of (careerPaths || [])) {
    if (!path?.slug) continue
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/careers/${path.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  for (const coach of (coaches || [])) {
    if (!coach?.id) continue
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/coaches/${coach.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
