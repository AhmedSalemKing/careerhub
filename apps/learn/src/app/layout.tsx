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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
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
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = document.documentElement.classList.contains('dark') ? '#0d0d0d' : '#ffffff';
              document.body.style.backgroundColor = t;
            } catch(e){}
          `,
        }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
          position={dir === 'rtl' ? 'top-left' : 'top-right'}
          richColors
          toastOptions={{
            style: { fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif", direction: dir },
            duration: 4000,
          }}
        />
      </body>
    </html>
  )
}
