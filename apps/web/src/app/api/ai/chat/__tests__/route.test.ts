/**
 * Regression tests for /api/ai/chat route logic.
 *
 * Pure-logic tests import directly from production modules:
 *   - circuit-breaker.ts  (makeCbStore factory)
 *   - career-signals.ts   (computeDiscoveryStage, DIMENSION_SIGNALS)
 *
 * Run: cd apps/web && npx jest src/app/api/ai/chat/__tests__/route.test.ts
 */

import { makeCbStore }           from '../circuit-breaker'
import { computeDiscoveryStage, DIMENSION_SIGNALS } from '../../../../[locale]/dashboard/assessment/career-signals'

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

  test('12 — empty conversation stays at stage 0', () => {
    expect(computeDiscoveryStage('', TOTAL_STAGES)).toBe(0)
  })

  test('13 — experience signal → stage 0', () => {
    expect(computeDiscoveryStage('اشتغلت على مشروع', TOTAL_STAGES)).toBe(0)
  })

  test('14 — interests signal alone → stage 1', () => {
    expect(computeDiscoveryStage('أنا بتستمتع بالبرمجة', TOTAL_STAGES)).toBe(1)
  })

  test('15 — skills signal (singular مهارة, root مهار) → stage 2', () => {
    expect(computeDiscoveryStage('عندي مهارة في JavaScript', TOTAL_STAGES)).toBe(2)
  })

  test('16 — skills signal (plural مهارات, root مهار) → stage 2', () => {
    expect(computeDiscoveryStage('عندي مهارات في JavaScript', TOTAL_STAGES)).toBe(2)
  })

  test('17 — multiple dimensions covered, returns highest touched', () => {
    const text = 'اشتغلت على مشروع وبتحب البرمجة وعندي مهارات في JavaScript'
    expect(computeDiscoveryStage(text, TOTAL_STAGES)).toBe(2)
  })

  test('18 — recommendation signal → stage 4 (max while active)', () => {
    expect(computeDiscoveryStage('أقترح عليك مسار Frontend Developer', TOTAL_STAGES)).toBe(4)
  })

  test('19 — never advances to stage 5 automatically (reserved for careerResult)', () => {
    const text = 'مشروع بتحب مهارة frontend توصية'
    const stage = computeDiscoveryStage(text, TOTAL_STAGES)
    expect(stage).toBeLessThan(TOTAL_STAGES - 1)
    expect(stage).toBe(4)
  })

  test('20 — dimensions can be revisited without being locked', () => {
    const textA = 'بتحب الكود'           // interests (stage 1)
    const textB = textA + ' مشروع'       // + experience (0 < 1), highest still 1
    expect(computeDiscoveryStage(textA, TOTAL_STAGES)).toBe(1)
    expect(computeDiscoveryStage(textB, TOTAL_STAGES)).toBe(1)
  })

  test('21 — message count alone does not determine progression', () => {
    // Single keyword with no experience/interest/skill content stays at 0
    const sparse = 'نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم . نعم'
    expect(computeDiscoveryStage(sparse, TOTAL_STAGES)).toBe(0)
  })

  test('22 — DIMENSION_SIGNALS has correct number of dimensions', () => {
    expect(DIMENSION_SIGNALS.length).toBe(5)  // dimensions 0-4; stage 5 = careerResult
  })

  test('23 — English technical terms in path dimension are recognized', () => {
    expect(computeDiscoveryStage('I want to do frontend work', TOTAL_STAGES)).toBe(3)
    expect(computeDiscoveryStage('interested in backend development', TOTAL_STAGES)).toBe(3)
    expect(computeDiscoveryStage('data science career', TOTAL_STAGES)).toBe(3)
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
