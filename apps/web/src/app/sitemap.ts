import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://deveway.com'
  return [
    { url: `${base}/ar`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/ar/careers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ar/coaches`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ar/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
