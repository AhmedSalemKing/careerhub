import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, locales, type Locale } from '../i18n'

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale =
    locale && (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  }
})

