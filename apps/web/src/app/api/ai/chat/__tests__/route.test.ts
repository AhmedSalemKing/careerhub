/**
 * Regression tests for /api/ai/chat route logic.
 *
 * Pure-logic tests import directly from production modules:
 *   - circuit-breaker.ts  (makeCbStore factory)
 *   - career-signals.ts   (computeDiscoveryStage, DIMENSION_SIGNALS)
 *   - route.ts            (classify429Body)
 *
 * Run: cd apps/web && npx jest src/app/api/ai/chat/__tests__/route.test.ts
 */

import { makeCbStore }           from '../circuit-breaker'
import { computeDiscoveryStage, DIMENSION_SIGNALS } from '../../../../[locale]/dashboard/assessment/career-signals'
import { classify429Body }       from '../gemini-utils'

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

  const u = (content: string) => ({ role: 'user', content })
  const a = (content: string) => ({ role: 'assistant', content })

  test('12 — empty conversation stays at stage 0', () => {
    expect(computeDiscoveryStage([], TOTAL_STAGES)).toBe(0)
  })

  test('13 — experience signal → stage 0', () => {
    expect(computeDiscoveryStage([u('اشتغلت على مشروع')], TOTAL_STAGES)).toBe(0)
  })

  test('14 — interests signal alone → stage 1', () => {
    expect(computeDiscoveryStage([u('أنا بتستمتع بالبرمجة')], TOTAL_STAGES)).toBe(1)
  })

  test('15 — skills signal (singular مهارة, root مهار) → stage 2', () => {
    expect(computeDiscoveryStage([u('عندي مهارة في JavaScript')], TOTAL_STAGES)).toBe(2)
  })

  test('16 — skills signal (plural مهارات, root مهار) → stage 2', () => {
    expect(computeDiscoveryStage([u('عندي مهارات في JavaScript')], TOTAL_STAGES)).toBe(2)
  })

  test('17 — multiple dimensions covered, returns highest touched', () => {
    const text = 'اشتغلت على مشروع وبتحب البرمجة وعندي مهارات في JavaScript'
    expect(computeDiscoveryStage([u(text)], TOTAL_STAGES)).toBe(2)
  })

  test('18 — recommendation signal → stage 4 (max while active)', () => {
    expect(computeDiscoveryStage([u('أقترح عليك مسار Frontend Developer')], TOTAL_STAGES)).toBe(4)
  })

  test('19 — never advances to stage 5 automatically (reserved for careerResult)', () => {
    const text = 'مشروع بتحب مهارة frontend توصية'
    const stage = computeDiscoveryStage([u(text)], TOTAL_STAGES)
    expect(stage).toBeLessThan(TOTAL_STAGES - 1)
    expect(stage).toBe(4)
  })

  test('20 — dimensions can be revisited without being locked', () => {
    const textA = 'بتحب الكود'           // interests (stage 1)
    const textB = textA + ' مشروع'       // + experience (0 < 1), highest still 1
    expect(computeDiscoveryStage([u(textA)], TOTAL_STAGES)).toBe(1)
    expect(computeDiscoveryStage([u(textB)], TOTAL_STAGES)).toBe(1)
  })

  test('21 — message count alone does not determine progression', () => {
    // Single keyword with no experience/interest/skill content stays at 0
    const sparse = 'نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم'
    expect(computeDiscoveryStage([u(sparse)], TOTAL_STAGES)).toBe(0)
  })

  test('22 — DIMENSION_SIGNALS has correct number of dimensions', () => {
    expect(DIMENSION_SIGNALS.length).toBe(5)  // dimensions 0-4; stage 5 = careerResult
  })

  test('23 — English technical terms in path dimension are recognized', () => {
    expect(computeDiscoveryStage([u('I want to do frontend work')], TOTAL_STAGES)).toBe(3)
    expect(computeDiscoveryStage([u('interested in backend development')], TOTAL_STAGES)).toBe(3)
    expect(computeDiscoveryStage([u('data science career')], TOTAL_STAGES)).toBe(3)
  })

  test('26 — assistant-only messages do not trigger stage progression', () => {
    // AI says "أخبرني عن مشروعك" — should not count as user experience signal
    const msgs = [a('أخبرني عن مشروعك ومهاراتك وتوصيتك')]
    expect(computeDiscoveryStage(msgs, TOTAL_STAGES)).toBe(0)
  })

  test('27 — user messages count; assistant messages with same text do not add', () => {
    const content = 'عندي مهارة في backend'
    // user says it → stage 3 (مهارة hits dim 2, backend hits dim 3)
    expect(computeDiscoveryStage([u(content)], TOTAL_STAGES)).toBe(3)
    // only assistant says it → stage 0
    expect(computeDiscoveryStage([a(content)], TOTAL_STAGES)).toBe(0)
  })

  test('28 — "ai" in email address does not trigger path dimension (word boundary)', () => {
    // "email" contains "ai" as substring; \bai\b should not match
    expect(computeDiscoveryStage([u('راسلني على email@domain.com')], TOTAL_STAGES)).toBe(0)
    // But standalone "ai" does match
    expect(computeDiscoveryStage([u('I am interested in ai')], TOTAL_STAGES)).toBe(3)
  })

  test('29 — خبر without ة/ي/ات does not trigger experience dimension', () => {
    // "أخبرني" (tell me) contains root خبر but is not a user experience claim
    expect(computeDiscoveryStage([u('أخبرني عن ديفي واي')], TOTAL_STAGES)).toBe(0)
    // "خبرة" (experience) does match
    expect(computeDiscoveryStage([u('عندي خبرة سنتين في React')], TOTAL_STAGES)).toBe(0)
  })
})

// ── Duplicate STT submission prevention ─────────────────────────────────────

describe('Hands-free — duplicate submission guard', () => {
  test('24 — submittedRef prevents double submission', () => {
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

  test('25 — non-final results are ignored', () => {
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

// ── classify429Body ──────────────────────────────────────────────────────────

describe('classify429Body — Gemini quota type detection', () => {
  const perMinuteBody = JSON.stringify({
    error: {
      code: 429,
      details: [{
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          quota_metric: 'generativelanguage.googleapis.com/generate_content_requests_per_minute_per_project_per_model',
        },
      }],
    },
  })

  const perDayBody = JSON.stringify({
    error: {
      code: 429,
      details: [{
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          quota_metric: 'generativelanguage.googleapis.com/generate_content_requests_per_day_per_project_per_model',
        },
      }],
    },
  })

  const freeTierBody = JSON.stringify({
    error: {
      code: 429,
      details: [{
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          quota_metric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests_per_day',
        },
      }],
    },
  })

  test('30 — per-minute metric → model_rate_limit', () => {
    expect(classify429Body(perMinuteBody)).toBe('model_rate_limit')
  })

  test('31 — per-day metric → account_quota', () => {
    expect(classify429Body(perDayBody)).toBe('account_quota')
  })

  test('32 — free-tier metric → account_quota', () => {
    expect(classify429Body(freeTierBody)).toBe('account_quota')
  })

  test('33 — malformed/non-JSON body → unknown', () => {
    expect(classify429Body('Too Many Requests')).toBe('unknown')
    expect(classify429Body('')).toBe('unknown')
  })

  test('34 — JSON with no ErrorInfo details → unknown', () => {
    const body = JSON.stringify({ error: { code: 429, message: 'Rate limit exceeded' } })
    expect(classify429Body(body)).toBe('unknown')
  })

  test('35 — details present but no ErrorInfo type → unknown', () => {
    const body = JSON.stringify({
      error: {
        details: [{
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [],
        }],
      },
    })
    expect(classify429Body(body)).toBe('unknown')
  })
})
