import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Cairo, Poppins } from 'next/font/google'
import { Providers } from '../components/Providers'
import { Navbar } from '../components/Navbar'
import '../globals.css'

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', weight: ['400', '600', '700', '800'] })
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['400', '600', '700', '800'] })

const locales = ['ar', 'en']

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={`${cairo.variable} ${poppins.variable} font-sans bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
      <NextIntlClientProvider messages={messages}>
        <Providers>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </Providers>
      </NextIntlClientProvider>
    </div>
  )
}
