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
  title: 'DeveWay — منصة التطوير المهني',
  description: 'DeveWay — منصة احترافية للتطوير المهني والكورسات والاستشارات المهنية',
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
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (!theme && prefersDark);

                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                  document.documentElement.style.backgroundColor = isDark ? '#0d0d0d' : '#ffffff';
                  if (document.body) document.body.style.backgroundColor = isDark ? '#0d0d0d' : '#ffffff';
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
        
        {/* Minimal critical CSS - only prevent flash on html/body */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html.dark { color-scheme: dark; }
            html:not(.dark) { color-scheme: light; }
            html, body { min-height: 100vh; }
            html { background-color: #ffffff; }
            html.dark { background-color: #0d0d0d; }
          `
        }} />
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