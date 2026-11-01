/**
 * stt-controller.test.ts
 *
 * Tests for the STT lifecycle controller.
 * All tests run in Node (no browser) via a mock SpeechRecognition factory.
 */

import {
  createSttController,
  mergeSttSegment,
  normalizeSttText,
  DEFAULT_SILENCE_MS,
  DEFAULT_MIN_COMMIT_CHARS,
  DEFAULT_MIN_COMMIT_SEGMENTS,
  DEFAULT_MAX_RESTARTS,
} from '../stt-controller'
import type { SttRecognizer, SttResultEvent } from '../stt-controller'

/* ── Mock SpeechRecognition ──────────────────────────────── */

interface MockRec extends SttRecognizer {
  _fire(type: 'start' | 'end' | 'error', detail?: object): void
  _result(transcript: string, isFinal: boolean, resultIndex?: number): void
}

function makeMockRec(): MockRec {
  let onstart:   SttRecognizer['onstart']   = null
  let onresult:  SttRecognizer['onresult']  = null
  let onend:     SttRecognizer['onend']     = null
  let onerror:   SttRecognizer['onerror']   = null

  const rec: MockRec = {
    lang: '',
    continuous: false,
    interimResults: false,
    get onstart()  { return onstart },
    set onstart(v) { onstart = v },
    get onresult() { return onresult },
    set onresult(v) { onresult = v },
    get onend()    { return onend },
    set onend(v)   { onend = v },
    get onerror()  { return onerror },
    set onerror(v) { onerror = v },
    start()  { /* no-op */ },
    stop()   { /* no-op */ },
    _fire(type, detail = {}) {
      if (type === 'start')  onstart?.()
      if (type === 'end')    onend?.()
      if (type === 'error')  onerror?.(detail as { error?: string })
    },
    _result(transcript, isFinal, resultIndex = 0) {
      const result = Object.assign([{ transcript }], { isFinal, length: 1 })
      const event: SttResultEvent = {
        resultIndex,
        results: Object.assign({ length: 1, 0: result }, {}),
      }
      onresult?.(event)
    },
  }
  return rec
}

/* ── Pure helper tests ───────────────────────────────────── */

describe('normalizeSttText', () => {
  test('trims and collapses whitespace', () => {
    expect(normalizeSttText('  أنا  أحب  البرمجة  ')).toBe('أنا أحب البرمجة')
  })
  test('empty string stays empty', () => {
    expect(normalizeSttText('')).toBe('')
  })
})

describe('mergeSttSegment', () => {
  test('first result is returned as-is', () => {
    expect(mergeSttSegment('', 'أنا أحب البرمجة')).toBe('أنا أحب البرمجة')
  })

  test('plain concatenation when no overlap', () => {
    expect(mergeSttSegment('أنا أحب', 'البرمجة جداً')).toBe('أنا أحب البرمجة جداً')
  })

  test('de-duplicates overlapping tail/head', () => {
    expect(mergeSttSegment('أنا أحب البرمجة', 'البرمجة جداً')).toBe('أنا أحب البرمجة جداً')
  })

  test('ignores a segment identical to existing', () => {
    expect(mergeSttSegment('أنا أحب', 'أنا أحب')).toBe('أنا أحب')
  })

  test('handles multi-word overlap from restart', () => {
    const a = 'وأنا عندي خبرة في البرمجة بالجافا'
    const b = 'في البرمجة بالجافا والبايثون'
    expect(mergeSttSegment(a, b)).toBe('وأنا عندي خبرة في البرمجة بالجافا والبايثون')
  })
})

/* ── Controller lifecycle tests ──────────────────────────── */

describe('createSttController', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  function makeController(overrides: {
    autoSubmit?: boolean
    silenceMs?: number
    onCommit?: jest.Mock
    onError?: jest.Mock
    onStateChange?: jest.Mock
    onRestartExhausted?: jest.Mock
  } = {}) {
    const recs: MockRec[] = []
    const onCommit       = overrides.onCommit       ?? jest.fn()
    const onError        = overrides.onError        ?? jest.fn()
    const onStateChange  = overrides.onStateChange  ?? jest.fn()
    const onRestartExhausted = overrides.onRestartExhausted ?? jest.fn()

    const controller = createSttController({
      recognizer: () => {
        const r = makeMockRec()
        recs.push(r)
        return r
      },
      lang: 'ar-EG',
      autoSubmit: overrides.autoSubmit ?? true,
      silenceMs: overrides.silenceMs ?? 100,   // short for tests
      minCommitChars: DEFAULT_MIN_COMMIT_CHARS,
      minCommitSegments: DEFAULT_MIN_COMMIT_SEGMENTS,
      maxRestarts: DEFAULT_MAX_RESTARTS,
      restartDelayMs: 0,
      maxUtteranceMs: 600_000, // large enough not to fire in any test
      onCommit,
      onError,
      onStateChange,
      onRestartExhausted,
    })

    return { controller, recs, onCommit, onError, onStateChange, onRestartExhausted }
  }

  /* 1. Basic auto-commit (hands-free) */
  test('commits after silence when speech was received', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true })
    controller.begin()
    const rec = recs[0]
    rec._fire('start')
    rec._result('أنا أعمل في مجال التقنية وأحب تطوير البرامج', true)
    jest.advanceTimersByTime(200)   // silence timer fires
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit.mock.calls[0][1]).toBe('silence')
    expect(onCommit.mock.calls[0][0]).toContain('أعمل')
  })

  /* 2. Push-to-talk: silence does NOT commit */
  test('push-to-talk: silence does not commit, stop() does', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: false })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا أعمل في مجال التقنية وأحب تطوير البرامج', true)
    jest.advanceTimersByTime(10_000)  // long silence
    expect(onCommit).not.toHaveBeenCalled()
    controller.stop()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit.mock.calls[0][1]).toBe('manual')
  })

  /* 3. Unexpected Chrome session end — controller restarts */
  test('unexpected onend triggers restart without submitting', () => {
    const { controller, recs, onCommit, onStateChange } = makeController({ autoSubmit: true })
    controller.begin()
    const rec1 = recs[0]
    rec1._fire('start')
    rec1._result('أنا عندي اهتمام', true)  // partial answer
    rec1._fire('end')   // Chrome killed the session unexpectedly

    // onCommit must NOT be called: the user has not finished
    expect(onCommit).not.toHaveBeenCalled()

    // A new recognizer should be created (restart)
    jest.runAllTimers()
    expect(recs.length).toBeGreaterThan(1)
    const rec2 = recs[recs.length - 1]
    rec2._fire('start')
    expect(onStateChange).toHaveBeenCalledWith('listening')
  })

  /* 4. Merged text survives across sessions */
  test('text from dead session is preserved in restart', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا أعمل في مجال التقنية', true)
    recs[0]._fire('end')          // Chrome killed session

    // Advance only enough to fire the restart (0ms) without the ceiling (180s)
    jest.advanceTimersByTime(50)
    const rec2 = recs[1]
    rec2._fire('start')
    rec2._result('وأحب تطوير البرامج', true)
    jest.advanceTimersByTime(200) // silence
    expect(onCommit).toHaveBeenCalledTimes(1)
    const committed = onCommit.mock.calls[0][0] as string
    expect(committed).toContain('أعمل في مجال التقنية')
    expect(committed).toContain('وأحب')
  })

  /* 5. Interim results don't trigger commit, final does */
  test('interim results do not commit, final results do', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true, silenceMs: 50 })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا أعمل', false)    // interim
    jest.advanceTimersByTime(100)         // silence fires but interim is still pending...
    // The controller won't commit because lastWasFinal=false when interim was last
    // Send the final now
    recs[0]._result('أنا أعمل في مجال التقنية وأحب تطوير البرامج', true)
    jest.advanceTimersByTime(100)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  /* 6. Short pause in the middle of a long answer doesn't commit */
  test('short pause inside answer does not trigger premature commit', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true, silenceMs: 6_000 })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا أعمل في مجال التقنية', true)
    jest.advanceTimersByTime(3_000)   // 3s pause — shorter than 6s silence window
    expect(onCommit).not.toHaveBeenCalled()
    recs[0]._result('وأحب تطوير البرامج أيضاً', true)
    jest.advanceTimersByTime(7_000)   // now full silence
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  /* 7. manual stop() during active listening — submits available text */
  test('stop() during listening commits whatever was captured', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا عندي خبرة في البرمجة', true)
    controller.stop()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit.mock.calls[0][1]).toBe('manual')
  })

  /* 8. Mic permission denied — permanent error, no restart */
  test('not-allowed error stops listening permanently', () => {
    const { controller, recs, onCommit, onError } = makeController()
    controller.begin()
    recs[0]._fire('start')
    recs[0]._fire('error', { error: 'not-allowed' })
    jest.runAllTimers()
    expect(recs.length).toBe(1)          // no restart
    expect(onCommit).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith('not-allowed')
  })

  /* 9. Stale callbacks from old session are ignored */
  test('callbacks from a cancelled session are ignored', () => {
    const { controller, recs, onCommit } = makeController()
    controller.begin()
    const rec1 = recs[0]
    rec1._fire('start')
    controller.cancel()         // cancels the session
    // Stale result from rec1 arrives after cancel
    rec1._result('أنا أعمل في مجال التقنية وأحب تطوير البرامج', true)
    jest.runAllTimers()
    expect(onCommit).not.toHaveBeenCalled()
  })

  /* 10. Each commit fires exactly once */
  test('commit fires exactly once even with multiple final results', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('أنا أعمل في مجال التقنية وأحب تطوير البرامج جداً', true)
    jest.advanceTimersByTime(200)   // silence — commits
    recs[0]._result('وأيضاً أحب الذكاء الاصطناعي', true)
    jest.advanceTimersByTime(200)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  /* 11. Restart budget exhausted — text is kept, error not fired */
  test('restart budget exhausted calls onRestartExhausted with captured text', () => {
    const recs2: MockRec[] = []
    const onCommit2 = jest.fn()
    const onRestartExhausted2 = jest.fn()
    const ctrl = createSttController({
      recognizer: () => {
        const r = makeMockRec()
        recs2.push(r)
        return r
      },
      lang: 'ar-EG',
      autoSubmit: true,
      silenceMs: 100,
      maxRestarts: 2,          // allows 2 restarts (3 total sessions)
      restartDelayMs: 0,
      maxUtteranceMs: 600_000, // avoid ceiling timer firing in test
      onCommit: onCommit2,
      onRestartExhausted: onRestartExhausted2,
    })
    ctrl.begin()
    // Session 0 (initial)
    recs2[0]._fire('start')
    recs2[0]._result('بدأت الحديث', true)
    recs2[0]._fire('end')          // unexpected end → restart 1
    jest.advanceTimersByTime(50)   // trigger restart timer only
    // Session 1 (restart 1)
    recs2[1]._fire('start')
    recs2[1]._fire('end')          // unexpected end → restart 2
    jest.advanceTimersByTime(50)
    // Session 2 (restart 2)
    recs2[2]._fire('start')
    recs2[2]._fire('end')          // unexpected end → budget exhausted
    jest.advanceTimersByTime(50)
    expect(onRestartExhausted2).toHaveBeenCalledTimes(1)
    expect(onCommit2).not.toHaveBeenCalled()
    expect(onRestartExhausted2.mock.calls[0][0]).toContain('بدأت')
  })

  /* 12. Fragment (too short) does not auto-commit */
  test('very short final result does not auto-commit', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true, silenceMs: 50 })
    controller.begin()
    recs[0]._fire('start')
    recs[0]._result('لا', true)   // 2 chars — below MIN_COMMIT_CHARS (12)
    jest.advanceTimersByTime(200)
    expect(onCommit).not.toHaveBeenCalled()
    // Explicit stop still submits whatever we have
    controller.stop()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit.mock.calls[0][1]).toBe('manual')
  })

  /* 13. Seed text from carry-over continues previous session */
  test('begin() with seed text merges with new speech', () => {
    const { controller, recs, onCommit } = makeController({ autoSubmit: true })
    controller.begin('أنا أعمل في مجال التقنية')
    recs[0]._fire('start')
    recs[0]._result('وأحب تطوير البرامج', true)
    jest.advanceTimersByTime(200)
    expect(onCommit.mock.calls[0][0]).toContain('أعمل في مجال التقنية')
    expect(onCommit.mock.calls[0][0]).toContain('وأحب')
  })
})
