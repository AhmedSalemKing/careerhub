/**
 * Server-side JWT verification for Next.js AI API routes.
 * Proxies to the NestJS /auth/me endpoint — avoids sharing JWT_SECRET across apps.
 */

import { NextRequest } from 'next/server'

export interface AuthUser {
  id:        string
  email:     string
  firstName: string | null
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api')
  .replace(/\/+$/, '')

/**
 * Extract + verify the request's JWT by proxying to the NestJS /auth/me endpoint.
 * Returns null when the token is absent, invalid, or the user is inactive/banned.
 * Times out in 4 s — well within the AI route's own timeout budget.
 */
export async function verifyRequest(req: NextRequest): Promise<AuthUser | null> {
  // Prefer the cookie (set by setToken() in auth.ts) then fall back to Bearer header.
  const token =
    req.cookies.get('deveway_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — Next.js fetch extension
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as {
      success?: boolean
      data?: { id?: string; email?: string; profile?: { firstName?: string } }
    }
    const u = data?.data
    if (!u?.id) return null
    return {
      id:        u.id,
      email:     u.email ?? '',
      firstName: u.profile?.firstName ?? null,
    }
  } catch {
    return null
  }
}
