import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ToastProvider } from '../lib/toast'
import { QueryProvider } from '../lib/query'
import { LoadingProvider } from './components/PageLoader'
import { TokenSync } from './components/TokenSync'
import KeepAlivePing from './components/KeepAlivePing'
import NumberInputGuard from './components/NumberInputGuard'

export const metadata: Metadata = {
  metadataBase: new URL('https://devewayhub.vercel.app'),
  title: {
    default: 'DeveWay | منصة التدريب',
    template: '%s | DeveWay',
  },
  description: 'منصة DeveWay للتدريب الاحترافي - كورسات معتمدة وجلسات لايف واستشارات مهنية',
  keywords: ['كورسات', 'تدريب', 'تعليم', 'مهارات', 'مسار مهني', 'شهادات معتمدة'],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'DeveWay',
    title: 'DeveWay | منصة التدريب',
    description: 'منصة DeveWay للتدريب الاحترافي - كورسات معتمدة وجلسات لايف',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DeveWay' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeveWay | منصة التدريب',
    description: 'منصة DeveWay للتدريب الاحترافي',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className="no-transition"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://api.deveways.com" />
        <link rel="dns-prefetch" href="https://api.deveways.com" />
        <meta name="theme-color" content="#5120C8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Mirror next-themes (key 'theme': light | dark | system, default system)
                  // so the class is right before first paint and never flips afterwards.
                  var theme = localStorage.getItem('theme');
                  var dark = theme === 'dark' ||
                    ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  root.classList.toggle('dark', dark);
                  root.classList.toggle('light', !dark);
                  root.style.colorScheme = dark ? 'dark' : 'light';
                } catch(e) {}
                window.addEventListener('load', function() {
                  requestAnimationFrame(function() {
                    document.documentElement.classList.remove('no-transition');
                  });
                });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NumberInputGuard />
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <ToastProvider>
                <LoadingProvider>
                  <Suspense><TokenSync /></Suspense>
                  <KeepAlivePing />
                  <div className="flex min-h-screen flex-col">
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </LoadingProvider>
              </ToastProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Toaster
          className="deveway-toast"
          position="top-center"
          dir={dir}
          toastOptions={{
            duration: 4000,
            className: 'deveway-toast',
            style: {
              fontFamily: 'var(--font-body)',
              background: 'var(--card-bg)',
              border: '1px solid rgba(16,185,129,0.4)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.18)',
              color: 'var(--foreground)',
              borderRadius: '14px',
              padding: '12px 16px',
            },
          }}
        />
      </body>
    </html>
  )
}
