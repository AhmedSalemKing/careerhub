import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './components/Providers'
import { LoadingProvider } from './components/PageLoader'
import type { Locale } from '../i18n'

const madinetAlBat = localFont({
  src: [
    { path: '../assets/fonts/MadinetAl-Bat-v4.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/MadinetAl-Bat-v2.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-madinet',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.deveways.com'),
  title: {
    default: 'DeveWay | منصة التعليم والتطوير المهني',
    template: '%s | DeveWay',
  },
  description: 'منصة تعليمية عربية متكاملة للكورسات المهنية والكوتشينج وبناء المسار الوظيفي. An Arabic educational platform for professional courses, coaching, and career development.',
  keywords: ['كورسات اون لاين', 'تعليم عربي', 'كوتشينج مهني', 'مسار وظيفي', 'شهادات معتمدة', 'online courses arabic', 'career coaching', 'DeveWay'],
  authors: [{ name: 'DeveWay', url: 'https://www.deveways.com' }],
  creator: 'DeveWay',
  publisher: 'DeveWay',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    url: 'https://www.deveways.com',
    siteName: 'DeveWay',
    title: 'DeveWay | منصة التعليم والتطوير المهني',
    description: 'منصة تعليمية عربية متكاملة للكورسات والكوتشينج وبناء المسار الوظيفي',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DeveWay Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeveWay | منصة التعليم والتطوير المهني',
    description: 'منصة تعليمية عربية متكاملة للكورسات والكوتشينج',
    images: ['/og-image.png'],
    creator: '@deveways',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  alternates: {
    canonical: 'https://www.deveways.com',
    languages: {
      'ar': 'https://www.deveways.com/ar',
      'en': 'https://www.deveways.com/en',
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${madinetAlBat.variable} no-transition`}
      suppressHydrationWarning
    >
      <head>
        {/* Script: Set initial theme + prevent background flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('deveway-theme') || localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (!theme && prefersDark);

                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                } catch(e) {}
              })();
            `,
          }}
        />
        
        <style dangerouslySetInnerHTML={{
          __html: `
            body { background: var(--background); }
            :root { color-scheme: light; }
            :root.dark { color-scheme: dark; }
            html, body { min-height: 100vh; }
            :root { background-color: #ffffff; }
            :root.dark { background-color: #0d0d0d; }
          `
        }} />
        
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function ping() {
              fetch('https://deve-way.onrender.com/api/health', { 
                method: 'GET',
                signal: AbortSignal.timeout(5000)
              }).catch(() => {});
            }
            ping();
            setInterval(ping, 840000);
          })();
        ` }} />
      </head>
      
      {/* Body uses CSS variables only */}
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers locale={locale}>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </Providers>
        </NextIntlClientProvider>
        
        <Toaster
          position={dir === 'rtl' ? 'top-left' : 'top-right'}
          expand={false}
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-madinet), 'DM Sans', 'Segoe UI', Arial, sans-serif",
              direction: dir,
            },
            duration: 4000,
          }}
        />
      </body>
    </html>
  )
}