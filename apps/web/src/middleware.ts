import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n'

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
})

const EGP_COUNTRIES = new Set(['EG'])

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request)

  response.cookies.set('NEXT_LOCALE', defaultLocale, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  })

  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    ''

  const market = EGP_COUNTRIES.has(country.toUpperCase()) ? 'EGP' : 'SAR'

  if (!request.cookies.has('market')) {
    response.cookies.set('market', market, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|learn|.*\\..*).*)'],
}
