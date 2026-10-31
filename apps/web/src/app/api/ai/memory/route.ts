/**
 * Server-side AI chat memory API.
 *
 * Persistence layer: the existing NestJS UserCareerPath table, using a
 * sentinel pathId (`__ai_chat_memory__`) so no DB migration is required.
 * The `UserCareerPath.upsert` on `{userId, pathId}` provides safe concurrent
 * writes (last write wins) and built-in user isolation — the NestJS endpoint
 * derives userId from the verified JWT, never from the request body.
 *
 * Known limitation: the NestJS `POST /career/paths/save` (bulk-replace)
 * deletes all UserCareerPath rows including this sentinel. If the user
 * selects career paths via that endpoint, their AI memory row is deleted;
 * it is recreated on the next PUT here, seeded from localStorage (handled
 * by useCareerMemory.ts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '../_auth'

export const runtime = 'nodejs'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api')
  .replace(/\/+$/, '')

export const MEMORY_PATH_ID = '__ai_chat_memory__'
const MAX_STORED_CHARS = 800

function extractToken(req: NextRequest): string | undefined {
  return (
    req.cookies.get('deveway_token')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    undefined
  )
}

// ── GET /api/ai/memory ─────────────────────────────────────────────────────
// Returns the authenticated user's stored CareerMemory, or null.

export async function GET(req: NextRequest) {
  const authUser = await verifyRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = extractToken(req)
  if (!token) return NextResponse.json({ memory: null })

  try {
    const res = await fetch(`${API_BASE}/career/paths/my`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ memory: null })

    const body = await res.json() as {
      data?: { pathId: string; careerPath: { titleEn: string } }[]
    }
    const sentinel = (body.data ?? []).find(p => p.pathId === MEMORY_PATH_ID)
    if (!sentinel) return NextResponse.json({ memory: null })

    let memory: unknown
    try { memory = JSON.parse(sentinel.careerPath.titleEn) } catch { return NextResponse.json({ memory: null }) }

    if (!memory || typeof memory !== 'object') return NextResponse.json({ memory: null })
    const m = memory as Record<string, unknown>

    // Validate userId matches authenticated user — prevents cross-user data leakage
    // if the sentinel record is somehow associated with a wrong user.
    if (m.userId !== authUser.id) return NextResponse.json({ memory: null })

    return NextResponse.json({ memory })
  } catch {
    return NextResponse.json({ memory: null })
  }
}

// ── PUT /api/ai/memory ─────────────────────────────────────────────────────
// Upserts the authenticated user's CareerMemory.
// userId is always derived from the verified JWT — never from the request body.

export async function PUT(req: NextRequest) {
  const authUser = await verifyRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = extractToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  const input = body as Record<string, unknown>

  // Build sanitized memory — userId is always from JWT, never from client body
  const sanitized: {
    userId: string
    lastResult: unknown
    sessionSummaries: unknown[]
    lastUpdated: string
  } = {
    userId:           authUser.id,
    lastResult:       input.lastResult ?? null,
    sessionSummaries: Array.isArray(input.sessionSummaries)
      ? (input.sessionSummaries as unknown[]).slice(0, 5)
      : [],
    lastUpdated:      new Date().toISOString(),
  }

  // Trim until it fits within the storage budget
  let serialized = JSON.stringify(sanitized)
  while (serialized.length > MAX_STORED_CHARS && sanitized.sessionSummaries.length > 0) {
    sanitized.sessionSummaries.pop()
    serialized = JSON.stringify(sanitized)
  }
  if (serialized.length > MAX_STORED_CHARS) {
    // Last resort: keep only primaryPath + matchScore from lastResult
    const lr = sanitized.lastResult as { primaryPath?: string; matchScore?: number } | null
    sanitized.lastResult = lr ? { primaryPath: lr.primaryPath, matchScore: lr.matchScore } : null
    sanitized.sessionSummaries = []
    serialized = JSON.stringify(sanitized)
  }

  try {
    const res = await fetch(`${API_BASE}/career/my-path`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body:   JSON.stringify({
        pathId:       MEMORY_PATH_ID,
        pathTitle:    serialized,
        pathCategory: 'ai_chat_memory',
        aiRecommended: false,
      }),
      signal: AbortSignal.timeout(4000),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: 502 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 })
  }
}
