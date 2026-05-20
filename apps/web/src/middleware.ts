import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n'

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
})

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request)

  response.cookies.set('NEXT_LOCALE', defaultLocale, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|learn|.*\\..*).*)'],
}
