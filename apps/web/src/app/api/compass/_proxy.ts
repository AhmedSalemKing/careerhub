/**
 * Thin proxy helper for Compass API routes.
 * Authenticates via the existing _auth pattern, then forwards to NestJS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '../ai/_auth'

export const runtime = 'nodejs'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api').replace(/\/+$/, '')

export async function proxyCompass(
  req: NextRequest,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<NextResponse> {
  const user = await verifyRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token =
    req.cookies.get('deveway_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  try {
    const upstream = await fetch(`${API_BASE}/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    })

    const data: unknown = await upstream.json().catch(() => null)
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
