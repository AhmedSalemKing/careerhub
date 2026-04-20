import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, locales, type Locale } from '../i18n'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const resolvedLocale =
    requested && (locales as readonly string[]).includes(requested) ? (requested as Locale) : defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  }
})

