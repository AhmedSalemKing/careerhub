/**
 * Voice regression tests.
 *
 * STT half: imports the REAL controller (`components/ai/stt-controller`) — the
 * exact module `useAIChat` delegates to. No logic is copied into this file, so
 * these tests fail if the production lifecycle regresses. Time is driven by
 * jest fake timers and the recognizer by a fake SpeechRecognition object.
 *
 * TTS half: drives the real /api/ai/tts-v2 route with mocked fetch.
 *
 * Scope: these prove lifecycle/decision logic. Real Chrome behaviour (the real
 * `ar-EG` session length, a real microphone, real speechSynthesis voices) can
 * only be verified manually — restarting Web Speech API never guarantees
 * gap-free capture, and this suite does not claim otherwise.
 *
 * Run: cd apps/web && npx jest src/app/api/ai/__tests__/voice.test.ts
 */
import {
  createSttController,
  mergeSttSegment,
  normalizeSttText,
  DEFAULT_SILENCE_MS,
} from '../../../../components/ai/stt-controller'
import type {
  SttRecognizer,
  SttResultEvent,
  SttCommitReason,
} from '../../../../components/ai/stt-controller'

//  ─────────────────────────────────────────────────────────────
//  Fake SpeechRecognition (mirrors the browser surface we use)
//  ─────────────────────────────────────────────────────────────

class MockSR implements SttRecognizer {
  lang           = ''
  continuous     = false
  interimResults = false

  onstart:  (() => void) | null = null
  onresult: ((e: SttResultEvent) => void) | null = null
  onend:    (() => void) | null = null
  onerror:  ((e: { error?: string }) => void) | null = null

  startCalls = 0
  stopCalls  = 0

  constructor(private readonly failFirstStart: () => boolean = () => false) {}

  start(): void {
    this.startCalls += 1
    if (this.startCalls === 1 && this.failFirstStart()) {
      throw new Error('InvalidStateError: already started')
    }
    this.onstart?.()
  }

  stop(): void {
    this.stopCalls += 1
    this.onend?.()
  }

  /** Emit a result event shaped like Chrome's SpeechRecognitionEvent. */
  emit(items: Array<{ transcript: string; isFinal: boolean }>, resultIndex = 0): void {
    const results = items.map(item =>
      Object.assign([{ transcript: item.transcript }], { isFinal: item.isFinal }),
    )
    this.onresult?.({ resultIndex, results } as unknown as SttResultEvent)
  }

  emitEnd(): void { this.onend?.() }
  emitError(error: string): void { this.onerror?.({ error }) }
}

interface HarnessOptions {
  autoSubmit?: boolean
  maxRestarts?: number
  silenceMs?: number
  maxUtteranceMs?: number
  /** 1-based recognizer instance numbers whose first start() throws. */
  failStartOn?: number[]
}

function harness(opts: HarnessOptions = {}) {
  const instances: MockSR[] = []
  const commits: Array<{ text: string; reason: SttCommitReason }> = []
  const errors: string[] = []
  const states: string[] = []
  const partials: string[] = []
  const exhausted: string[] = []
  let created = 0

  const controller = createSttController({
    recognizer: () => {
      created += 1
      const shouldFail = (opts.failStartOn ?? []).includes(created)
      const instance = new MockSR(() => shouldFail)
      instances.push(instance)
      return instance
    },
    lang: 'ar-EG',
    autoSubmit: opts.autoSubmit ?? true,
    silenceMs: opts.silenceMs ?? DEFAULT_SILENCE_MS,
    maxRestarts: opts.maxRestarts ?? 20,
    maxUtteranceMs: opts.maxUtteranceMs ?? 180_000,
    restartDelayMs: 300,
    onCommit: (text, reason) => commits.push({ text, reason }),
    onError: code => errors.push(code),
    onStateChange: state => states.push(state),
    onPartial: text => partials.push(text),
    onRestartExhausted: text => exhausted.push(text),
  })

  const latest = () => instances[instances.length - 1]
  return { controller, instances, latest, commits, errors, states, partials, exhausted }
}

describe('STT - unexpected onend', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  test('does not submit when recognition ends by itself, and restarts instead', () => {
    const h = harness()
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أنا أبحث عن وظيفة في مجال البرمجة', isFinal: true }])

    h.instances[0].emitEnd()                 // Chrome session limit, not the user

    expect(h.commits).toHaveLength(0)        // onend is NOT "answer finished"
    jest.advanceTimersByTime(299)
    expect(h.instances).toHaveLength(1)      // restart is not synchronous
    jest.advanceTimersByTime(1)
    expect(h.instances).toHaveLength(2)      // recovered on a fresh session
    expect(h.commits).toHaveLength(0)
  })
})

describe('STT - multiple recognizer sessions', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  test('keeps every final result across sessions and submits once on stop', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أنا حاصل على بكالوريوس هندسة', isFinal: true }])
    h.instances[0].emitEnd()
    jest.advanceTimersByTime(300)

    h.latest().emit([{ transcript: 'وأعمل منذ ثلاث سنوات', isFinal: true }])
    h.controller.stop()

    expect(h.commits).toHaveLength(1)
    expect(h.commits[0]).toEqual({
      text: 'أنا حاصل على بكالوريوس هندسة وأعمل منذ ثلاث سنوات',
      reason: 'manual',
    })
  })

  test('keeps interim text when a session dies before the phrase is final', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أبحث عن فرصة عمل', isFinal: false }])
    expect(h.controller.text).toBe('أبحث عن فرصة عمل')

    h.instances[0].emitEnd()
    jest.advanceTimersByTime(300)
    expect(h.controller.text).toBe('أبحث عن فرصة عمل')   // not dropped

    h.latest().emit([{ transcript: 'أبحث عن فرصة عمل في القاهرة', isFinal: true }])
    h.controller.stop()

    expect(h.commits[0].text).toBe('أبحث عن فرصة عمل في القاهرة')
  })
})

describe('STT - interim/final merge and de-duplication', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  test('shows interim text inside the final transcript without duplication', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أعمل في مجال', isFinal: true }])
    h.instances[0].emit([{ transcript: 'تطوير البرمجيات', isFinal: false }])

    expect(h.controller.text).toBe('أعمل في مجال تطوير البرمجيات')

    h.instances[0].emit([{ transcript: 'تطوير البرمجيات', isFinal: true }])
    expect(h.controller.text).toBe('أعمل في مجال تطوير البرمجيات')
  })

  test('does not repeat a phrase re-emitted after a restart', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'خبرة في تطوير الويب', isFinal: true }])
    h.instances[0].emitEnd()
    jest.advanceTimersByTime(300)

    // Chrome often re-delivers the tail of the previous phrase.
    h.latest().emit([{ transcript: 'تطوير الويب منذ خمس سنوات', isFinal: true }])

    expect(h.controller.text).toBe('خبرة في تطوير الويب منذ خمس سنوات')
    expect(h.controller.text.match(/تطوير الويب/g)).toHaveLength(1)
  })

  test('handles a result event that repeats previous finals (resultIndex 0)', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أعمل في مجال تطوير', isFinal: true }])
    h.instances[0].emit([
      { transcript: 'أعمل في مجال تطوير', isFinal: true },
      { transcript: 'البرمجيات منذ خمس سنوات', isFinal: true },
    ])

    expect(h.controller.text).toBe('أعمل في مجال تطوير البرمجيات منذ خمس سنوات')
    expect(h.controller.text.match(/تطوير/g)).toHaveLength(1)
  })

  test('normalize/merge helpers collapse whitespace and overlaps', () => {
    expect(normalizeSttText('  أهلاً   بك  ')).toBe('أهلاً بك')
    expect(mergeSttSegment('', 'نص')).toBe('نص')
    expect(mergeSttSegment('نفس النص', 'نفس النص')).toBe('نفس النص')
    expect(mergeSttSegment('أعمل في', 'في القاهرة')).toBe('أعمل في القاهرة')
    expect(mergeSttSegment('خبرة في تطوير الويب', 'تطوير الويب منذ 2020'))
      .toBe('خبرة في تطوير الويب منذ 2020')
  })
})

describe('STT - end-of-utterance policy', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  test('a 4-second thinking pause does not submit (hands-free)', () => {
    const h = harness({ autoSubmit: true })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أريد أن أعمل في مجال', isFinal: true }])
    h.instances[0].emit([{ transcript: 'تطوير البرمجيات', isFinal: true }])

    jest.advanceTimersByTime(4_000)
    expect(h.commits).toHaveLength(0)        // user is thinking, not finished

    // The user resumes; the countdown restarts.
    h.instances[0].emit([{ transcript: 'ولدى خبرة في قيادة الفرق', isFinal: true }])
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS - 1)
    expect(h.commits).toHaveLength(0)
    jest.advanceTimersByTime(1)

    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].reason).toBe('silence')
    expect(h.commits[0].text).toBe(
      'أريد أن أعمل في مجال تطوير البرمجيات ولدى خبرة في قيادة الفرق',
    )
  })

  test('silence alone cannot commit while a phrase is still interim', () => {
    const h = harness({ autoSubmit: true })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'خبرة طويلة في إدارة المشاريع', isFinal: true }])
    h.instances[0].emit([{ transcript: 'والتسويق الرقمي', isFinal: false }])

    jest.advanceTimersByTime(DEFAULT_SILENCE_MS * 3)
    expect(h.commits).toHaveLength(0)
  })

  test('manual push-to-talk never submits on silence, only on stop', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'أعمل في مجال التسويق الرقمي', isFinal: true }])

    jest.advanceTimersByTime(60_000)
    expect(h.commits).toHaveLength(0)

    h.controller.stop()
    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].reason).toBe('manual')
  })

  test('an explicit stop submits immediately and blocks restart/duplicate sends', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'هذا جوابي الكامل', isFinal: true }])

    h.controller.stop()
    expect(h.commits).toHaveLength(1)

    // A late browser event from the retired session must be ignored.
    h.instances[0].emit([{ transcript: 'نص متأخر', isFinal: true }])
    h.instances[0].emitEnd()
    jest.advanceTimersByTime(10_000)

    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].text).toBe('هذا جوابي الكامل')
    expect(h.instances).toHaveLength(1)
  })

  test('stop twice never produces two submissions', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'جواب واحد فقط', isFinal: true }])
    h.controller.stop()
    h.controller.stop()

    expect(h.commits).toHaveLength(1)
  })

  test('stop before any speech sends nothing', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.controller.stop()
    expect(h.commits).toHaveLength(0)
  })

  test('after a restart, a finished phrase can still end by silence', () => {
    const h = harness({ autoSubmit: true })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'لدي خبرة في إدارة المشاريع', isFinal: true }])
    h.instances[0].emitEnd()
    jest.advanceTimersByTime(300)

    jest.advanceTimersByTime(DEFAULT_SILENCE_MS)
    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].reason).toBe('silence')
  })

  test('max-duration ceiling releases the mic', () => {
    const h = harness({ autoSubmit: false, maxUtteranceMs: 10_000 })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'جواب طويل جداً', isFinal: true }])
    jest.advanceTimersByTime(10_000)

    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].reason).toBe('max-duration')
  })
})

describe('STT - failures and restart budget', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  test('microphone denial stops for good and keeps the text', () => {
    const h = harness({ autoSubmit: true })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'نص قبل رفض الإذن', isFinal: true }])
    h.instances[0].emitError('not-allowed')

    expect(h.errors).toEqual(['not-allowed'])
    h.instances[0].emitEnd()
    jest.advanceTimersByTime(60_000)

    expect(h.instances).toHaveLength(1)
    expect(h.commits).toHaveLength(0)
    expect(h.controller.listening).toBe(false)
    expect(h.controller.text).toBe('نص قبل رفض الإذن')
  })

  test('stops restarting once the budget is exhausted and keeps the text', () => {
    const h = harness({ maxRestarts: 3 })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'خبرة طويلة في إدارة المشاريع', isFinal: true }])

    for (let i = 0; i < 3; i++) {
      h.latest().emitEnd()
      jest.advanceTimersByTime(300)
    }
    expect(h.instances).toHaveLength(4)

    h.latest().emitEnd()                     // 4th unexpected end > budget
    expect(h.exhausted).toEqual(['خبرة طويلة في إدارة المشاريع'])
    expect(h.commits).toHaveLength(0)        // never sends an unfinished answer

    jest.advanceTimersByTime(60_000)
    expect(h.instances).toHaveLength(4)      // no unlimited restart storm
  })

  test('InvalidStateError on restart retries without dropping accumulated text', () => {
    const h = harness({ failStartOn: [2] })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'خبرة في التسويق الرقمي', isFinal: true }])

    h.instances[0].emitEnd()
    jest.advanceTimersByTime(300)            // instance 2 throws on start()
    expect(h.instances).toHaveLength(2)
    expect(h.controller.text).toBe('خبرة في التسويق الرقمي')

    jest.advanceTimersByTime(300)            // retried on instance 3
    expect(h.instances).toHaveLength(3)

    h.controller.stop()
    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].text).toBe('خبرة في التسويق الرقمي')
  })

  test('cancel() tears down silently (clearChat / unmount)', () => {
    const h = harness()
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'نص يجب ألا يُرسل', isFinal: true }])
    h.controller.cancel()

    expect(h.controller.disposed).toBe(true)
    jest.advanceTimersByTime(60_000)
    expect(h.commits).toHaveLength(0)
    expect(h.instances).toHaveLength(1)
  })

  test('a stale session cannot affect a newer one', () => {
    const h = harness({ autoSubmit: false })
    h.controller.begin()
    h.instances[0].emit([{ transcript: 'الجلسة الأولى', isFinal: true }])
    h.controller.cancel()

    h.controller.begin()
    h.instances[1].emit([{ transcript: 'الجلسة الثانية', isFinal: true }])
    h.instances[0].emit([{ transcript: 'متأخر من الجلسة الأولى', isFinal: true }])
    h.instances[0].emitEnd()
    h.controller.stop()

    expect(h.commits).toHaveLength(1)
    expect(h.commits[0].text).toBe('الجلسة الثانية')
  })
})

//  ─────────────────────────────────────────────────────────────
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

    const res = await POST(makeTtsReq({ text: 'مرحبا', gender: 'male' }))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/audio\/l16/)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-2.5-flash-preview-tts')
  })

  test('13b — voice is always Charon regardless of gender parameter', async () => {
    const { POST } = await import('../tts-v2/route')

    mockFetch.mockResolvedValueOnce({
      ok:      true,
      headers: { get: (h: string) => h === 'content-type' ? 'text/event-stream' : null },
      body:    pcmStream(),
    } as unknown as Response)

    await POST(makeTtsReq({ text: 'مرحبا', gender: 'female' }))

    const reqBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string ?? '{}')
    expect(reqBody.generationConfig?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName).toBe('Charon')
  })

  test('14 — primary 429 → retry is attempted', async () => {
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

    const res = await POST(makeTtsReq({ text: 'اختبار', gender: 'male' }))

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][0]).toContain('gemini-2.5-flash-preview-tts')
    expect(mockFetch.mock.calls[1][0]).toContain('gemini-2.5-flash-preview-tts')
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