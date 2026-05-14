import { MetadataRoute } from 'next'

const BASE_URL = 'https://devewayhub.vercel.app'
const API = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
const locales = ['ar', 'en']

async function fetchCourses() {
  try {
    const res = await fetch(`${API}/courses?limit=100&status=PUBLISHED`, { next: { revalidate: 86400 } })
    const data = await res.json()
    return data?.data?.courses || data?.data || []
  } catch { return [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '', '/courses', '/coaches', '/coaching', '/careers',
    '/pricing', '/faq', '/my-courses',
  ]

  const courses = await fetchCourses()
  const entries: MetadataRoute.Sitemap = []

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
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
      })
    }
  }

  return entries
}
