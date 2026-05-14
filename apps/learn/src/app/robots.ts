import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/ar/dashboard/', '/en/dashboard/',
          '/ar/payment/', '/en/payment/',
          '/ar/checkout/', '/en/checkout/',
        ],
      },
    ],
    sitemap: 'https://devewayhub.vercel.app/sitemap.xml',
  }
}
