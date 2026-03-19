import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'cloudflare.com', 'imagedelivery.net'],
  },
}
export default withNextIntl(nextConfig)
