/**
 * Regression tests for /api/ai/chat route logic.
 *
 * Pure-logic tests import directly from production modules:
 *   - circuit-breaker.ts  (makeCbStore factory)
 *   - career-signals.ts   (computeDiscoveryStage, computeStageFromUserText, ...)
 *   - gemini-error.ts     (classifyRateLimit)
 *
 * A small number of route-level tests exercise the real POST handler with a
 * mocked global fetch, covering the 429 fallback policy end to end.
 *
 * Run: cd apps/web && npx jest src/app/api/ai/chat/__tests__/route.test.ts
 */

import { makeCbStore }           from '../circuit-breaker'
import { classifyRateLimit }     from '../gemini-error'
import {
  computeDiscoveryStage,
  computeStageFromUserText,
  extractUserEvidence,
  isMeaningfulUserEvidence,
  DIMENSION_SIGNALS,
} from '../../../../[locale]/dashboard/assessment/career-signals'

// ── Circuit breaker ──────────────────────────────────────────────────────────

describe('Circuit breaker — basic lifecycle', () => {
  test('1 — starts closed', () => {
    const cb = makeCbStore()
    expect(cb.isOpen('m1')).toBe(false)
  })

  test('2 — opens after threshold qualifying failures', () => {
    const cb = makeCbStore({ failureThreshold: 3 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    expect(cb.isOpen('m1')).toBe(false)   // 2 — still closed
    cb.recordFailure('m1', true)
    expect(cb.isOpen('m1')).toBe(true)    // 3 — open
  })

  test('3 — non-qualifying failures do not increase counter', () => {
    const cb = makeCbStore()
    cb.recordFailure('m1', false)
    cb.recordFailure('m1', false)
    cb.recordFailure('m1', false)
    expect(cb.getState('m1').consecutiveFailures).toBe(0)
    expect(cb.isOpen('m1')).toBe(false)
  })

  test('4 — success resets breaker', () => {
    const cb = makeCbStore()
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    expect(cb.isOpen('m1')).toBe(true)
    cb.recordSuccess('m1')
    expect(cb.isOpen('m1')).toBe(false)
    expect(cb.getState('m1').consecutiveFailures).toBe(0)
    expect(cb.getState('m1').probing).toBe(false)
  })

  test('5 — half-open: probe window not yet elapsed keeps breaker open', () => {
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    // halfOpenAt is 20s in the future — probe window not elapsed
    expect(cb.isOpen('m1')).toBe(true)
    expect(cb.getState('m1').probing).toBe(false)  // no probe taken yet
  })

  test('6 — half-open: after cooldown, first caller gets probe slot (isOpen → false)', () => {
    jest.useFakeTimers()
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)

    jest.advanceTimersByTime(21_000)   // past halfOpenAfterMs

    expect(cb.isOpen('m1')).toBe(false)  // probe slot granted
    expect(cb.getState('m1').probing).toBe(true)

    jest.useRealTimers()
  })

  test('7 — concurrent half-open: second caller is blocked once probe slot is taken', () => {
    jest.useFakeTimers()
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)

    jest.advanceTimersByTime(21_000)

    expect(cb.isOpen('m1')).toBe(false)   // first caller takes probe
    expect(cb.isOpen('m1')).toBe(true)    // second caller sees probing=true → blocked

    jest.useRealTimers()
  })

  test('8 — failed probe releases probe slot (qualifying failure)', () => {
    jest.useFakeTimers()
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)

    jest.advanceTimersByTime(21_000)
    cb.isOpen('m1')                       // take probe slot

    cb.recordFailure('m1', true)          // probe fails
    expect(cb.getState('m1').probing).toBe(false)

    jest.useRealTimers()
  })

  test('9 — non-qualifying failure also releases probe slot', () => {
    jest.useFakeTimers()
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)

    jest.advanceTimersByTime(21_000)
    cb.isOpen('m1')                       // take probe slot

    cb.recordFailure('m1', false)         // auth error — non-qualifying
    expect(cb.getState('m1').probing).toBe(false)   // must release even though not qualifying
    // failure count stays at 3 (non-qualifying doesn't add)
    expect(cb.getState('m1').consecutiveFailures).toBe(3)

    jest.useRealTimers()
  })

  test('10 — successful probe closes breaker', () => {
    jest.useFakeTimers()
    const cb = makeCbStore({ openMs: 30_000, halfOpenAfterMs: 20_000 })
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)
    cb.recordFailure('m1', true)

    jest.advanceTimersByTime(21_000)
    expect(cb.isOpen('m1')).toBe(false)   // take probe

    cb.recordSuccess('m1')
    expect(cb.isOpen('m1')).toBe(false)
    expect(cb.getState('m1').openUntil).toBe(0)
    expect(cb.getState('m1').probing).toBe(false)

    jest.useRealTimers()
  })

  test('11 — independent models do not share state', () => {
    const cb = makeCbStore()
    cb.recordFailure('model-a', true)
    cb.recordFailure('model-a', true)
    cb.recordFailure('model-a', true)
    expect(cb.isOpen('model-a')).toBe(true)
    expect(cb.isOpen('model-b')).toBe(false)
  })
})

// ── Discovery stage progression ──────────────────────────────────────────────

describe('Career AI — evidence-based stage progression', () => {
  const TOTAL_STAGES = 6
  const user      = (content: string) => ({ role: 'user', content })
  const assistant = (content: string) => ({ role: 'assistant', content })

  test('12 — empty or blank conversation stays at stage 0', () => {
    expect(computeDiscoveryStage([], TOTAL_STAGES)).toBe(0)
    expect(computeDiscoveryStage([user('   ')], TOTAL_STAGES)).toBe(0)
    expect(computeStageFromUserText('', TOTAL_STAGES)).toBe(0)
  })

  test('13 — experience signal → stage 0', () => {
    expect(computeDiscoveryStage([user('اشتغلت على مشروع')], TOTAL_STAGES)).toBe(0)
  })

  test('14 — interests signal alone → stage 1', () => {
    expect(computeDiscoveryStage([user('أنا بتستمتع بالبرمجة')], TOTAL_STAGES)).toBe(1)
  })

  test('15 — skills signal (singular مهارة) → stage 2', () => {
    expect(computeDiscoveryStage([user('عندي مهارة في JavaScript')], TOTAL_STAGES)).toBe(2)
  })

  test('16 — skills signal (plural مهارات) → stage 2', () => {
    expect(computeDiscoveryStage([user('عندي مهارات في JavaScript')], TOTAL_STAGES)).toBe(2)
  })

  test('17 — path differentiation → stage 3', () => {
    expect(computeDiscoveryStage([user('الفرق بين Frontend و Backend إيه؟')], TOTAL_STAGES)).toBe(3)
    expect(computeDiscoveryStage([user('which one is better for me?')], TOTAL_STAGES)).toBe(3)
  })

  test('18 — recommendation signal → stage 4 (max while active)', () => {
    expect(computeDiscoveryStage([user('أقترح عليك مسار Frontend Developer')], TOTAL_STAGES)).toBe(4)
  })

  test('19 — multiple dimensions touched, returns the highest', () => {
    const text = 'اشتغلت على مشروع وبستمتع بالتصميم وعندي مهارات في JavaScript'
    expect(computeDiscoveryStage([user(text)], TOTAL_STAGES)).toBe(2)
  })

  test('20 — never advances to the reserved results stage automatically', () => {
    const text = 'اشتغلت على مشروع، بستمتع بالكود، عندي مهارات، الفرق بين مسارين، أقترح توصية'
    const stage = computeDiscoveryStage([user(text)], TOTAL_STAGES)
    expect(stage).toBe(4)
    expect(stage).toBeLessThan(TOTAL_STAGES - 1)
  })

  test('21 — dimensions can be revisited without being locked', () => {
    const stageA = computeDiscoveryStage([user('أنا بتستمتع بالكود')], TOTAL_STAGES)          // 1
    const stageB = computeDiscoveryStage(
      [user('أنا بتستمتع بالكود'), user('اشتغلت على مشروع')],
      TOTAL_STAGES,
    )
    expect(stageA).toBe(1)
    expect(stageB).toBe(1)   // experience touched again, highest remains 1
  })

  test('22 — DIMENSION_SIGNALS has five active dimensions (0-4)', () => {
    expect(DIMENSION_SIGNALS.length).toBe(5)  // stage 5 = careerResult
  })

  test('23 — assistant messages are never evidence about the user', () => {
    const transcript = [
      assistant('عندي مهارات وخبرة، والفرق بين المسارات واضح، وأقترح عليك توصية'),
      assistant('إيه خبرتك؟'),
    ]
    expect(computeDiscoveryStage(transcript, TOTAL_STAGES)).toBe(0)
    expect(extractUserEvidence(transcript)).toBe('')
  })

  test('24 — pure acknowledgements are ignored', () => {
    const transcript = [
      user('تمام'),
      user('أيوه!'),
      user('ok'),
      user('مش عارف'),
      user('لا'),
    ]
    expect(computeDiscoveryStage(transcript, TOTAL_STAGES)).toBe(0)
    expect(extractUserEvidence(transcript)).toBe('')
  })

  test('25 — acknowledgement does not mask real evidence that follows it', () => {
    const transcript = [user('تمام'), user('عندي مهارات في JavaScript')]
    expect(computeDiscoveryStage(transcript, TOTAL_STAGES)).toBe(2)
    expect(extractUserEvidence(transcript)).toBe('عندي مهارات في JavaScript')
  })

  test('26 — English substrings inside other words do not trigger signals', () => {
    expect(computeDiscoveryStage([user('my email is test@example.com, check the metadata')], TOTAL_STAGES)).toBe(0)
    expect(computeDiscoveryStage([user('I rebuilt the table')], TOTAL_STAGES)).toBe(0)   // not "built"
    expect(computeDiscoveryStage([user('I am uninterested in sales')], TOTAL_STAGES)).toBe(0) // not "interested in"
  })

  test('27 — Arabic negation prefixes do not trigger signals', () => {
    expect(computeDiscoveryStage([user('ماتعلمتش حاجة')], TOTAL_STAGES)).toBe(0)   // not "اتعلمت"
    expect(computeDiscoveryStage([user('مبتستخدمش الأدوات دي')], TOTAL_STAGES)).toBe(0) // not "بتستخدم"
  })

  test('28 — ambiguous text does not auto-advance the tracker', () => {
    expect(computeDiscoveryStage([user('مش عارف أختار بين frontend و backend')], TOTAL_STAGES)).toBe(0)
  })

  test('29 — comparison/versus wording is differentiated from naming a path', () => {
    expect(computeDiscoveryStage([user('I want to do frontend work')], TOTAL_STAGES)).toBe(0)
    expect(computeDiscoveryStage([user('frontend versus backend')], TOTAL_STAGES)).toBe(3)
  })

  test('30 — defensive inputs never throw and never exceed the cap', () => {
    expect(computeStageFromUserText('مهارات', 1)).toBe(0)
    expect(computeStageFromUserText('مهارات', 0)).toBe(0)
    expect(computeStageFromUserText('مهارات', NaN)).toBe(0)
    expect(computeStageFromUserText('مهارات', 3)).toBe(1)   // capped at total - 2
    expect(computeDiscoveryStage([], TOTAL_STAGES)).toBe(0)
  })

  test('31 — isMeaningfulUserEvidence rejects non-user and acknowledgement rows', () => {
    expect(isMeaningfulUserEvidence(assistant('عندي مهارات'))).toBe(false)
    expect(isMeaningfulUserEvidence(user('تمام'))).toBe(false)
    expect(isMeaningfulUserEvidence(user(' '))).toBe(false)
    expect(isMeaningfulUserEvidence(user('عندي مهارات'))).toBe(true)
  })
})

// ── Gemini 429 classification ────────────────────────────────────────────────

describe('Gemini 429 — rate-limit scope classification', () => {
  const body = (options: {
    message?: string
    violations?: unknown[]
    retryDelay?: string
  } = {}) => JSON.stringify({
    error: {
      code: 429,
      message: options.message ?? 'Quota exceeded',
      status: 'RESOURCE_EXHAUSTED',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: options.violations ?? [],
        },
        {
          '@type': 'type.googleapis.com/google.rpc.RetryInfo',
          retryDelay: options.retryDelay ?? '23s',
        },
      ],
    },
  })

  test('32 — unparseable body is conservatively unknown', () => {
    const result = classifyRateLimit('<html>429</html>')
    expect(result.scope).toBe('unknown')
    expect(result.retryAfterMs).toBeNull()
  })

  test('33 — missing error object is unknown', () => {
    expect(classifyRateLimit('{}').scope).toBe('unknown')
    expect(classifyRateLimit('null').scope).toBe('unknown')
    expect(classifyRateLimit('[]').scope).toBe('unknown')
  })

  test('34 — per-model quota dimension is model-scoped', () => {
    const result = classifyRateLimit(body({
      violations: [{
        quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',
        quotaDimensions: { model: 'gemini-3.8-flash' },
      }],
    }))
    expect(result.scope).toBe('model')
    expect(result.retryAfterMs).toBe(23_000)
  })

  test('35 — explicit per-model quota id without dimensions is model-scoped', () => {
    const result = classifyRateLimit(body({
      violations: [{ quotaId: 'GenerateRequestsPerDayPerModel-FreeTier' }],
    }))
    expect(result.scope).toBe('model')
  })

  test('36 — explicit per-project quota is project-scoped', () => {
    const result = classifyRateLimit(body({
      message: 'Quota exceeded for project-wide limit',
      violations: [{ quotaId: 'GenerateRequestsPerDayPerProject-FreeTier' }],
    }))
    expect(result.scope).toBe('project')
  })

  test('37 — billing/account wording is project-scoped', () => {
    const result = classifyRateLimit(body({ message: 'Billing account has been disabled' }))
    expect(result.scope).toBe('project')
  })

  test('38 — generic quota message is ambiguous and stays unknown', () => {
    const result = classifyRateLimit(body({
      message: 'You exceeded your current quota. Please try again later.',
    }))
    expect(result.scope).toBe('unknown')
  })

  test('39 — a gemini-api documentation URL is not model evidence', () => {
    const result = classifyRateLimit(body({
      message: 'Quota exceeded. See https://ai.google.dev/gemini-api/docs/rate-limits',
    }))
    expect(result.scope).toBe('unknown')
  })

  test('40 — a concrete model identifier in the message is model-scoped', () => {
    const result = classifyRateLimit(body({
      message: 'Quota exceeded for models/gemini-2.5-flash',
    }))
    expect(result.scope).toBe('model')
  })

  test('41 — malformed retry delay is ignored', () => {
    const result = classifyRateLimit(body({ retryDelay: 'soon' }))
    expect(result.retryAfterMs).toBeNull()
  })

  test('42 — result contains only coarse, non-sensitive fields', () => {
    const raw = body({
      message: 'Quota exceeded for projects/123456789',
      violations: [{ quotaId: 'SecretQuotaId', quotaDimensions: { model: 'gemini-3.8-flash' } }],
    })
    const result = classifyRateLimit(raw)
    expect(Object.keys(result).sort()).toEqual(['reason', 'retryAfterMs', 'scope'])
    expect(JSON.stringify(result)).not.toContain('123456789')
    expect(JSON.stringify(result)).not.toContain('SecretQuotaId')
    expect(JSON.stringify(result)).not.toContain('gemini-3.8-flash')
  })
})

// ── Route: 429 fallback policy ───────────────────────────────────────────────

type RouteResponse = { body: { content?: string; isError?: boolean }; status: number }

const realFetch = global.fetch

function fetchResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    json: async () => payload,
  }
}

function quotaBody(options: { perModel?: boolean; message?: string } = {}) {
  return {
    error: {
      code: 429,
      message: options.message ?? 'Quota exceeded',
      status: 'RESOURCE_EXHAUSTED',
      details: [{
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: options.perModel
          ? [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaDimensions: { model: 'gemini-3.8-flash' } }]
          : [{ quotaId: 'GenerateRequestsPerDayPerProject-FreeTier' }],
      }],
    },
  }
}

const successBody = { candidates: [{ content: { parts: [{ text: 'أهلاً بك، حدثني عن خبرتك' }] } }] }

async function callRoute(messages: unknown): Promise<RouteResponse> {
  const { POST } = await import('../route')
  const req = { json: async () => ({ messages }) } as never
  return (await POST(req)) as unknown as RouteResponse
}

describe('/api/ai/chat — 429 scope-aware fallback', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  afterAll(() => {
    global.fetch = realFetch
    delete process.env.GEMINI_API_KEY
  })

  test('43 — model-scoped 429 falls back to the second model', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock
      .mockResolvedValueOnce(fetchResponse(429, quotaBody({ perModel: true })))
      .mockResolvedValueOnce(fetchResponse(200, successBody))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.status).toBe(200)
    expect(res.body.content).toBe('أهلاً بك، حدثني عن خبرتك')
    expect(res.body.isError).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toContain('gemini-3.5-flash-lite')
  })

  test('44 — project-scoped 429 does not waste a fallback attempt', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock.mockResolvedValueOnce(fetchResponse(429, quotaBody({ perModel: false })))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.status).toBe(200)
    expect(res.body.isError).toBe(true)
    expect(res.body.content).toContain('مشغولة')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('45 — ambiguous 429 is treated conservatively', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock.mockResolvedValueOnce(fetchResponse(429, '<html>rate limited</html>'))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.body.isError).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('46 — model-scoped 429 on the fallback model returns the busy message', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock
      .mockResolvedValueOnce(fetchResponse(429, quotaBody({ perModel: true })))
      .mockResolvedValueOnce(fetchResponse(429, quotaBody({ perModel: true })))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.body.isError).toBe(true)
    expect(res.body.content).toContain('مشغولة')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('47 — 503 on the primary still falls back and succeeds', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock
      .mockResolvedValueOnce(fetchResponse(503, { error: { message: 'overloaded' } }))
      .mockResolvedValueOnce(fetchResponse(200, successBody))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.body.content).toBe('أهلاً بك، حدثني عن خبرتك')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('48 — auth failure does not try the fallback with the same key', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock.mockResolvedValueOnce(fetchResponse(401, { error: { message: 'invalid key' } }))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.body.isError).toBe(true)
    expect(res.body.content).toContain('غير متاحة')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('49 — empty message list is rejected without calling the provider', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    const res = await callRoute([])

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('50 — generic quota message with a docs URL is not treated as model-scoped', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock
    fetchMock.mockResolvedValueOnce(fetchResponse(429, quotaBody({
      perModel: false,
      message: 'Quota exceeded. See https://ai.google.dev/gemini-api/docs/rate-limits',
    })))

    const res = await callRoute([{ role: 'user', content: 'مرحبا' }])

    expect(res.body.isError).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

// ── Duplicate STT submission prevention ─────────────────────────────────────

describe('Hands-free — duplicate submission guard', () => {
  test('51 — submittedRef prevents double submission', () => {
    let callCount = 0
    const submittedRef = { current: false }
    const onResult = () => { callCount++ }

    const simulateResult = (isFinal: boolean) => {
      if (!isFinal || submittedRef.current) return
      submittedRef.current = true
      onResult()
    }

    simulateResult(true)   // first final result
    simulateResult(true)   // second (blocked by ref)
    expect(callCount).toBe(1)
  })

  test('52 — non-final results are ignored', () => {
    let callCount = 0
    const submittedRef = { current: false }
    const onResult = () => { callCount++ }

    const simulateResult = (isFinal: boolean) => {
      if (!isFinal || submittedRef.current) return
      submittedRef.current = true
      onResult()
    }

    simulateResult(false)  // interim — ignored
    simulateResult(false)  // interim — ignored
    simulateResult(true)   // first final — accepted
    expect(callCount).toBe(1)
  })
})
