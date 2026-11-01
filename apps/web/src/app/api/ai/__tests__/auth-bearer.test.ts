/**
 * Route-level bearer auth tests — T59–T66.
 *
 * Verifies that:
 *  1. Every protected AI route returns 401 with no authentication.
 *  2. Every protected AI route accepts a Bearer-only token (no cookie).
 *
 * Strategy: no jest.mock for _auth — verifyRequest runs for real.
 * global.fetch is mocked to control NestJS /auth/me responses.
 * jest.resetModules() before each test ensures a clean module registry.
 */

import type { NextRequest } from 'next/server'

// ── Shared fixtures ───────────────────────────────────────────────────────────

function noAuthReq(body: object = {}): NextRequest {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
    headers: { get: () => null },
  } as unknown as NextRequest
}

function bearerReq(body: object = {}): NextRequest {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
    headers: {
      get: (n: string) =>
        n.toLowerCase() === 'authorization' ? 'Bearer valid-test-token' : null,
    },
  } as unknown as NextRequest
}

function authMeOk() {
  return {
    ok:   true,
    json: async () => ({
      success: true,
      data: { id: 'u1', email: 'a@b.com', profile: { firstName: 'Test' } },
    }),
  }
}

// ── No-auth → 401 ─────────────────────────────────────────────────────────────

describe('Route auth gate — no auth → 401', () => {
  const origFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    process.env.GEMINI_API_KEY = 'test-key'
    global.fetch = origFetch
  })

  afterEach(() => {
    global.fetch = origFetch
    jest.restoreAllMocks()
  })

  test('T59 — tts-v2 POST: no cookie, no bearer → 401', async () => {
    const { POST } = await import('../tts-v2/route')
    const res = await POST(noAuthReq({ text: 'نص', gender: 'male' }))
    expect(res.status).toBe(401)
  })

  test('T60 — memory GET: no cookie, no bearer → 401', async () => {
    const { GET } = await import('../memory/route')
    const res = await GET(noAuthReq())
    expect(res.status).toBe(401)
  })

  test('T61 — memory PUT: no cookie, no bearer → 401', async () => {
    const { PUT } = await import('../memory/route')
    const res = await PUT(noAuthReq({ userId: 'u1', lastResult: null, sessionSummaries: [] }))
    expect(res.status).toBe(401)
  })

  test('T62 — chat POST: no cookie, no bearer → 401', async () => {
    const { POST } = await import('../chat/route')
    const res = await POST(noAuthReq({ messages: [] }))
    expect(res.status).toBe(401)
  })
})

// ── Bearer-only → auth gate passes ────────────────────────────────────────────
//
// These tests mock NestJS /auth/me to return a valid user for the bearer token.
// The downstream service (Gemini or NestJS) is also mocked with a minimal
// response so the route can complete. What matters is the response is NOT 401.

describe('Route auth gate — bearer-only auth passes gate', () => {
  const origFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    process.env.GEMINI_API_KEY = 'test-key'
  })

  afterEach(() => {
    global.fetch = origFetch
    jest.restoreAllMocks()
  })

  test('T63 — tts-v2 POST: bearer-only → not 401 (Gemini call reached)', async () => {
    // Auth passes → route proceeds to Gemini → Gemini fails (503) → our 503, not 401.
    // tts-v2 route has primary + secondary model slots → 2 Gemini calls total.
    const gemini503 = {
      ok: false, status: 503,
      text: async () => JSON.stringify({ error: { status: 'UNAVAILABLE' } }),
    }
    const mockFetch = jest.fn()
      .mockResolvedValueOnce(authMeOk() as unknown as Response)  // auth/me
      .mockResolvedValueOnce(gemini503 as unknown as Response)   // Gemini primary
      .mockResolvedValueOnce(gemini503 as unknown as Response)   // Gemini secondary
    global.fetch = mockFetch

    jest.resetModules()
    const { POST } = await import('../tts-v2/route')
    const res = await POST(bearerReq({ text: 'مرحبا', gender: 'male' }))

    expect(res.status).not.toBe(401)
    expect(mockFetch).toHaveBeenCalledTimes(3)  // auth/me + Gemini primary + secondary
  })

  test('T64 — memory GET: bearer-only → 200 (empty memory)', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce(authMeOk() as unknown as Response)
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({ data: [] }),
      } as unknown as Response)
    global.fetch = mockFetch

    jest.resetModules()
    const { GET } = await import('../memory/route')
    const res = await GET(bearerReq())

    // Auth gate passed → route processed → not 401
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)  // auth/me + paths/my
  })

  test('T65 — chat POST: bearer-only → not 401', async () => {
    // Auth passes → route proceeds to Gemini → minimal Gemini response
    const mockFetch = jest.fn()
      .mockResolvedValueOnce(authMeOk() as unknown as Response)
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'مرحبا، أنا رشيد.' }] },
            finishReason: 'STOP',
          }],
        }),
      } as unknown as Response)
    global.fetch = mockFetch

    jest.resetModules()
    const { POST } = await import('../chat/route')
    const res = await POST(bearerReq({
      messages: [{ role: 'user', content: 'مرحبا' }],
    }))

    expect(res.status).not.toBe(401)
    expect(mockFetch).toHaveBeenCalledTimes(2)  // auth/me + Gemini chat
  })
})
