import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/ar/dashboard/', '/en/dashboard/',
          '/ar/admin/', '/en/admin/',
          '/api/',
          '/ar/checkout/', '/en/checkout/',
          '/ar/auth/', '/en/auth/',
          '/ar/payment/', '/en/payment/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/ar/dashboard/', '/en/dashboard/', '/ar/admin/', '/en/admin/'],
      },
    ],
    sitemap: 'https://www.deveways.com/sitemap.xml',
    host: 'https://www.deveways.com',
  }
}
