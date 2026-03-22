import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { Poppins } from 'next/font/google'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from './components/Providers'
import type { Locale } from '../i18n'
import { LearnHeader } from './components/LearnHeader'

const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['400', '500', '600', '700'] })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'CareerHub Academy',
  description: 'CareerHub training LMS',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={`${poppins.variable} ${cairo.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <div className="flex min-h-screen flex-col">
                <LearnHeader />
                <main className="flex-1">{children}</main>
              </div>
            </Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
