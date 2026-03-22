import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://careerhub.com'}/sitemap.xml`,
  }
}
