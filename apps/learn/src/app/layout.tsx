// ==========================================
// File: src/app/layout.tsx
// ==========================================
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ToastProvider } from '../lib/toast'
import { QueryProvider } from '../lib/query'
import { LoadingProvider } from './components/PageLoader'

export const metadata: Metadata = {
  title: 'DeveWay | منصة التدريب',
  description: 'منصة DeveWay للتدريب الاحترافي - كورسات معتمدة وجلسات لايف',
  keywords: 'كورسات, تدريب, تعليم, مهارات, مسار مهني',
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
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && prefersDark) || (!theme && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
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
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <ToastProvider>
                <LoadingProvider>
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