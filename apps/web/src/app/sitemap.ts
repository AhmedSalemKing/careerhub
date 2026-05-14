import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.deveways.com'
const API = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
const locales = ['ar', 'en']

async function fetchCourses() {
  try {
    const res = await fetch(`${API}/courses?limit=100&status=PUBLISHED`, { next: { revalidate: 86400 } })
    const data = await res.json()
    return data?.data?.courses || data?.data || []
  } catch { return [] }
}

async function fetchCareerPaths() {
  try {
    const res = await fetch(`${API}/career/paths`, { next: { revalidate: 86400 } })
    const data = await res.json()
    return data?.data || []
  } catch { return [] }
}

async function fetchCoaches() {
  try {
    const res = await fetch(`${API}/coaching/coaches`, { next: { revalidate: 86400 } })
    const data = await res.json()
    return data?.data || []
  } catch { return [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '', '/courses', '/coaches', '/coaching', '/careers',
    '/pricing', '/faq', '/contact', '/help', '/login', '/register',
  ]

  const [courses, careerPaths, coaches] = await Promise.all([
    fetchCourses(), fetchCareerPaths(), fetchCoaches(),
  ])

  const entries: MetadataRoute.Sitemap = []

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
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
  }

  for (const course of courses) {
    if (!course.slug) continue
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/courses/${course.slug}`,
        lastModified: new Date(course.updatedAt || course.createdAt || new Date()),
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: {
          languages: {
            ar: `${BASE_URL}/ar/courses/${course.slug}`,
            en: `${BASE_URL}/en/courses/${course.slug}`,
          },
        },
      })
    }
  }

  for (const path of careerPaths) {
    if (!path.slug) continue
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/careers/${path.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  for (const coach of coaches) {
    if (!coach.id) continue
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
