/**
 * Focused regression tests for voice-input continuity (STT) and TTS resilience.
 *
 * STT tests:  replicate the startListening closure logic in a pure, React-free
 *             simulation so the timer and restart behaviour can be verified
 *             deterministically with jest.useFakeTimers().
 *
 * TTS tests:  test the /api/ai/tts-v2 route with mocked fetch responses.
 *
 * Run: cd apps/web && npx jest src/app/api/ai/__tests__/voice.test.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
//  STT simulation helpers
// ─────────────────────────────────────────────────────────────────────────────

const SILENCE_MS = 2500

/** Minimal mock of the browser SpeechRecognition object. */
class MockSR {
  continuous     = false
  interimResults = false
  lang           = ''

  onstart:  (() => void) | null  = null
  onresult: ((e: unknown) => void) | null = null
  onend:    (() => void) | null  = null
  onerror:  ((e: { error?: string }) => void) | null = null

  startCalls = 0
  stopCalls  = 0

  start() { this.startCalls++; this.onstart?.() }
  stop()  { this.stopCalls++;  this.onend?.() }

  /** Fire an onresult event with one final result. */
  emitFinal(transcript: string, resultIndex = 0) {
    this.onresult?.({
      resultIndex,
      results: {
        length: resultIndex + 1,
        [resultIndex]: { isFinal: true,  0: { transcript } },
      },
    })
  }

  /** Fire an onresult event with one interim result. */
  emitInterim(transcript: string, resultIndex = 0) {
    this.onresult?.({
      resultIndex,
      results: {
        length: resultIndex + 1,
        [resultIndex]: { isFinal: false, 0: { transcript } },
      },
    })
  }

  /** Simulate the browser ending the session unexpectedly (no stop() call). */
  emitEndUnexpectedly() { this.onend?.() }

  emitError(code: string) { this.onerror?.({ error: code }); this.onend?.() }
}

/**
 * Replicates the startListening closure from useAIChat.ts without React.
 * Matches the production implementation exactly (same variable names, same logic).
 */
function createSttSession(
  onResult: (text: string) => void,
  onError?: (code: string) => void,
): { rec: MockSR; stop: () => void; getRestartCount: () => number } {
  const rec = new MockSR()
  rec.continuous = true
  rec.interimResults = true

  let accText        = ''
  let restartCount   = 0
  const MAX_RESTARTS = 20
  let stopRequested  = false
  let silenceTimer: ReturnType<typeof setTimeout> | null = null

  const submit = () => {
    const text = accText.trim()
    if (!text) return
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
    accText = ''
    stopRequested = true
    onResult(text)
    try { rec.stop() } catch { /* ignore */ }
  }

  rec.onresult = (e: unknown) => {
    const ev = e as {
      resultIndex: number
      results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }
    }
    let newFinal    = ''
    let hasActivity = false
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      hasActivity = true
      if (ev.results[i].isFinal) newFinal += (ev.results[i][0]?.transcript ?? '') + ' '
    }
    if (hasActivity) {
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(submit, SILENCE_MS)
    }
    if (!newFinal.trim()) return
    accText = (accText + ' ' + newFinal).trim()
  }

  rec.onend = () => {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
    if (!stopRequested && restartCount < MAX_RESTARTS) {
      restartCount++
      try { rec.start(); return } catch { /* fall through */ }
    }
    if (accText.trim()) {
      const text = accText.trim()
      accText = ''
      onResult(text)
    }
  }

  rec.onerror = (e: { error?: string }) => {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
    const isPermanent = ['not-allowed', 'audio-capture', 'service-not-allowed'].includes(e.error ?? '')
    if (isPermanent) stopRequested = true
    if (onError) onError(e.error ?? 'unknown')
  }

  rec.start()

  return {
    rec,
    stop: () => { stopRequested = true; try { rec.stop() } catch { /* ignore */ } },
    getRestartCount: () => restartCount,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  STT — timer + accumulation
// ─────────────────────────────────────────────────────────────────────────────

describe('STT — transcript accumulation across multiple recognition events', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('1 — final results from multiple events accumulate into one submission', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    rec.emitFinal('أنا')
    rec.emitFinal('بحب')
    rec.emitFinal('البرمجة')

    jest.advanceTimersByTime(SILENCE_MS)

    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult).toHaveBeenCalledWith('أنا بحب البرمجة')
  })

  test('2 — submission only happens after SILENCE_MS of inactivity', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    rec.emitFinal('كلمة')
    jest.advanceTimersByTime(SILENCE_MS - 100)
    expect(onResult).not.toHaveBeenCalled()

    jest.advanceTimersByTime(200)
    expect(onResult).toHaveBeenCalledTimes(1)
  })

  test('3 — interim results reset the silence timer (no premature cut-off)', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    // First final result → timer starts
    rec.emitFinal('مرحبا')

    // 2 s later: interim result arrives — timer should reset
    jest.advanceTimersByTime(2000)
    rec.emitInterim('ازيك')    // no final yet

    // 1.5 s later (only 1.5 s since last activity): should NOT have submitted yet
    jest.advanceTimersByTime(1500)
    expect(onResult).not.toHaveBeenCalled()

    // Another 1.1 s → 2.6 s since last activity → silence fires
    jest.advanceTimersByTime(1100)
    expect(onResult).toHaveBeenCalledWith('مرحبا')  // interim text is not added (no final)
  })

  test('4 — 30-second speech split across many events submits complete text', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    // Simulate a sentence spoken over ~15 s, one word every 1.5 s (< SILENCE_MS=2500)
    // Each word resets the silence timer before it can fire.
    const words = ['أنا', 'مهتم', 'بتطوير', 'البرمجيات', 'وعندي', 'خبرة', 'سنتين', 'في', 'React', 'وNode']
    words.forEach((word, i) => {
      jest.advanceTimersByTime(1500)
      rec.emitFinal(word, i)
    })

    // User finishes — silence timer fires
    jest.advanceTimersByTime(SILENCE_MS)

    expect(onResult).toHaveBeenCalledTimes(1)
    const submitted = onResult.mock.calls[0][0] as string
    expect(submitted).toContain('React')
    expect(submitted).toContain('أنا')
  })

  test('5 — no stale timer fires after explicit stop', () => {
    const onResult = jest.fn()
    const { rec, stop } = createSttSession(onResult)

    rec.emitFinal('نص')   // timer starts
    stop()                // explicit stop: flushes 'نص' immediately via onend

    jest.advanceTimersByTime(SILENCE_MS * 2)
    // onResult called once (via onend flush), not twice
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult).toHaveBeenCalledWith('نص')
  })

  test('6 — no duplicate submission when both silence timer and onend would fire', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    rec.emitFinal('الموضوع')

    // Timer fires: submits text, calls rec.stop() which fires onend again
    jest.advanceTimersByTime(SILENCE_MS)

    // onResult must be called exactly once (accText cleared by submit before stop())
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  STT — restart behaviour
// ─────────────────────────────────────────────────────────────────────────────

describe('STT — restart on unexpected onend', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('7 — recognition restarts when browser fires onend unexpectedly', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    const initialStarts = rec.startCalls  // 1 from createSttSession

    // Browser kills the session after ~5 s (Chrome behaviour on Arabic)
    rec.emitEndUnexpectedly()

    // startListening should have called rec.start() again
    expect(rec.startCalls).toBe(initialStarts + 1)
    expect(onResult).not.toHaveBeenCalled()   // no text accumulated yet
  })

  test('8 — transcript is preserved across a restart', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    // User speaks the first part of their answer
    rec.emitFinal('أنا عندي خبرة')

    // Browser kills session mid-speech (before silence timer fires)
    rec.emitEndUnexpectedly()

    // User continues after restart
    rec.emitFinal('في البرمجة')

    // Silence fires → complete text submitted
    jest.advanceTimersByTime(SILENCE_MS)

    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult.mock.calls[0][0]).toContain('أنا عندي خبرة')
    expect(onResult.mock.calls[0][0]).toContain('في البرمجة')
  })

  test('9 — restart counter increments and stops at MAX_RESTARTS', () => {
    const onResult = jest.fn()
    const { rec, getRestartCount } = createSttSession(onResult)

    // Simulate 20 unexpected browser ends in a row
    for (let i = 0; i < 20; i++) {
      rec.emitEndUnexpectedly()
    }
    expect(getRestartCount()).toBe(20)

    // 21st unexpected end — restart limit reached; session finalizes
    const startsBefore = rec.startCalls
    rec.emitEndUnexpectedly()
    expect(rec.startCalls).toBe(startsBefore)  // no more starts
  })

  test('10 — explicit stop does not trigger restart', () => {
    const onResult = jest.fn()
    const { rec, stop } = createSttSession(onResult)

    const startsBefore = rec.startCalls

    stop()   // explicit stop

    // rec.stop() was called which fires onend, but stopRequested=true prevents restart
    expect(rec.startCalls).toBe(startsBefore)  // no new start
  })

  test('11 — permanent onerror (not-allowed) prevents restart', () => {
    const onError = jest.fn()
    const { rec } = createSttSession(jest.fn(), onError)

    const startsBefore = rec.startCalls

    rec.emitError('not-allowed')   // emits onerror then onend

    expect(onError).toHaveBeenCalledWith('not-allowed')
    expect(rec.startCalls).toBe(startsBefore)   // stopRequested=true → no restart
  })

  test('12 — transient onerror (no-speech) allows future restart', () => {
    const onResult = jest.fn()
    const { rec } = createSttSession(onResult)

    const startsBefore = rec.startCalls

    // 'no-speech' is NOT a permanent error → restart allowed
    rec.emitError('no-speech')

    expect(rec.startCalls).toBe(startsBefore + 1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  TTS — route with mocked fetch
// ─────────────────────────────────────────────────────────────────────────────

// Mock verifyRequest so auth never touches the real NestJS backend
jest.mock('../_auth', () => ({
  verifyRequest: jest.fn().mockResolvedValue({ id: 'u1', firstName: 'Test' }),
}))

// Minimal ReadableStream available in Node 18+ tests
function emptyStream(): ReadableStream {
  return new ReadableStream({ start(ctrl) { ctrl.close() } })
}

function pcmStream(): ReadableStream {
  // 40 ms of silence @ 24 kHz, 16-bit mono = 1920 bytes
  const silence = Buffer.alloc(1920, 0)
  const base64  = silence.toString('base64')
  const sseData = JSON.stringify({
    candidates: [{ content: { parts: [{ inlineData: { data: base64, mimeType: 'audio/l16;rate=24000' } }] } }],
  })
  const chunk   = new TextEncoder().encode(`data: ${sseData}\n\n`)
  return new ReadableStream({ start(ctrl) { ctrl.enqueue(chunk); ctrl.close() } })
}

/** Minimal mock NextRequest for TTS tests. */
function makeTtsReq(body: object) {
  return { json: async () => body } as unknown as import('next/server').NextRequest
}

/** Quota-exhausted error body Gemini returns for 429. */
const QUOTA_BODY = JSON.stringify({
  error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded', details: [] },
})

describe('TTS route — model fallback', () => {
  const origFetch = global.fetch
  const origKey   = process.env.GEMINI_API_KEY

  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    mockFetch = jest.fn()
    global.fetch = mockFetch
    // Ensure module is freshly loaded with the mocked _auth
    jest.resetModules()
  })

  afterEach(() => {
    global.fetch = origFetch
    process.env.GEMINI_API_KEY = origKey
  })

  test('13 — primary success returns audio stream', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch.mockResolvedValueOnce({
      ok:      true,
      headers: { get: (h: string) => h === 'content-type' ? 'text/event-stream' : null },
      body:    pcmStream(),
    } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'مرحبا', gender: 'female' }))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/audio\/l16/)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-3.8-flash-lite-tts')
  })

  test('14 — primary 429 → secondary model is attempted', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch
      .mockResolvedValueOnce({
        ok:   false,
        status: 429,
        text: async () => QUOTA_BODY,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok:      true,
        headers: { get: (h: string) => h === 'content-type' ? 'text/event-stream' : null },
        body:    pcmStream(),
      } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'اختبار', gender: 'female' }))

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-3.8-flash-lite-tts')
    expect(mockFetch.mock.calls[1][0]).toContain('gemini-3.8-flash-tts')
  })

  test('15 — primary 429 → secondary 429 → error JSON (quota_exceeded)', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => QUOTA_BODY } as unknown as Response)
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => QUOTA_BODY } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'اختبار', gender: 'female' }))
    const body = (res as { body: unknown }).body as { error: string }

    expect(res.status).toBe(429)
    expect(body.error).toBe('quota_exceeded')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  test('16 — primary 503 → secondary success', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch
      .mockResolvedValueOnce({
        ok: false, status: 503,
        text: async () => JSON.stringify({ error: { status: 'UNAVAILABLE' } }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok:      true,
        headers: { get: (h: string) => h === 'content-type' ? 'text/event-stream' : null },
        body:    pcmStream(),
      } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'نص', gender: 'male' }))

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  test('17 — auth error (401) is returned immediately without fallback', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch.mockResolvedValueOnce({
      ok: false, status: 401,
      text: async () => JSON.stringify({ error: { status: 'UNAUTHENTICATED' } }),
    } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'نص', gender: 'female' }))
    const body = (res as { body: unknown }).body as { error: string }

    expect(body.error).toBe('auth_error')
    expect(mockFetch).toHaveBeenCalledTimes(1)  // no secondary attempt
  })

  test('18 — network error on primary → secondary is attempted', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok:      true,
        headers: { get: (h: string) => h === 'content-type' ? 'text/event-stream' : null },
        body:    emptyStream(),
      } as unknown as Response)

    // Should not throw; returns 200 (empty stream counts as bad_audio only client-side)
    const res = await POST(makeTtsReq({ text: 'نص', gender: 'female' }))

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  test('19 — missing API key returns no_key error without calling fetch', async () => {
    delete process.env.GEMINI_API_KEY
    const { POST } = await import('../tts-v2/route')

    const res = await POST(makeTtsReq({ text: 'نص', gender: 'female' }))
    const body = (res as { body: unknown }).body as { error: string }

    expect(res.status).toBe(503)
    expect(body.error).toBe('no_key')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('20 — empty text after cleaning returns 400 without calling fetch', async () => {
    const { POST } = await import('../tts-v2/route')

    // Text that reduces to empty after the cleaner (all structural markers)
    const res = await POST(makeTtsReq({ text: '[CAREER_RESULT]{}[/CAREER_RESULT]', gender: 'female' }))

    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  TTS — parseGeminiError classification (via route behaviour)
// ─────────────────────────────────────────────────────────────────────────────

describe('TTS — error classification', () => {
  const origFetch = global.fetch
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-key'
    mockFetch = jest.fn()
    global.fetch = mockFetch
    jest.resetModules()
  })

  afterEach(() => { global.fetch = origFetch })

  test('21 — RATE_LIMIT_EXCEEDED body classified as quota_exceeded', async () => {
    const { POST } = await import('../tts-v2/route')
    const body = JSON.stringify({ error: { status: 'RATE_LIMIT_EXCEEDED', message: 'rate limit', details: [] } })

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => body } as unknown as Response)
      .mockResolvedValueOnce({ ok: false, status: 429, text: async () => body } as unknown as Response)

    const res = await POST(makeTtsReq({ text: 'نص', gender: 'female' }))
    expect((res as unknown as { body: { error: string } }).body.error).toBe('quota_exceeded')
  })

  test('22 — 400 bad_request is NOT retried on secondary', async () => {
    const { POST } = await import('../tts-v2/route')
    const body = JSON.stringify({ error: { status: 'INVALID_ARGUMENT', message: 'bad request', details: [] } })

    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => body } as unknown as Response)

    await POST(makeTtsReq({ text: 'نص', gender: 'female' }))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
