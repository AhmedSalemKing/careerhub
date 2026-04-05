import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/learn/:path*',
        destination: 'http://localhost:3002/:path*'
      }
    ]
  }
}

export default withNextIntl(nextConfig)
