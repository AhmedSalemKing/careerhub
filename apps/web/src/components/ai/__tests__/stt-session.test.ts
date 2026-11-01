import {
  createSttSession,
  joinSegments,
  normalizeTranscript,
  DEFAULT_SILENCE_MS,
  DEFAULT_MAX_DURATION_MS,
} from '../stt-session'

// ── helpers ─────────────────────────────────────────────────────────────────

function result(transcript: string, isFinal: boolean) {
  return { isFinal, 0: { transcript }, length: 1 }
}

function event(results: ReturnType<typeof result>[], resultIndex = 0) {
  const map: Record<number, ReturnType<typeof result>> = {}
  results.forEach((r, i) => { map[i] = r })
  return { resultIndex, results: Object.assign(map, { length: results.length }) }
}

function makeSession(overrides: Partial<Parameters<typeof createSttSession>[0]> = {}) {
  const partials: string[] = []
  const ends: { text: string; reason: string }[] = []
  const session = createSttSession({
    onPartial: t => partials.push(t),
    onEnd: (text, reason) => ends.push({ text, reason }),
    ...overrides,
  })
  return { session, partials, ends }
}

// ── normalization ───────────────────────────────────────────────────────────

describe('STT transcript normalization', () => {
  test('collapses whitespace and trims', () => {
    expect(normalizeTranscript('  أهلاً   بيك\n في   ديفي  ')).toBe('أهلاً بيك في ديفي')
  })

  test('joins segments and drops consecutive duplicates', () => {
    expect(joinSegments(['مرحبا', 'مرحبا', 'إزيك'], 'عامل ايه'))
      .toBe('مرحبا إزيك عامل ايه')
  })

  test('interim is appended after finals', () => {
    expect(joinSegments(['اشتغلت على'], 'مشروع صغير')).toBe('اشتغلت على مشروع صغير')
  })

  test('missing interim does not add spacing noise', () => {
    expect(joinSegments(['نص'], '')).toBe('نص')
  })
})

// ── accumulation ────────────────────────────────────────────────────────────

describe('STT session — long answers are not cut early', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('1 — multiple final segments accumulate instead of overwriting', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('اشتغلت على مشروع', true)]))
    session.feed(event([result('وكان عبارة عن API', true)]))
    session.feed(event([result('بـ Node.js', true)]))

    expect(session.text).toBe('اشتغلت على مشروع وكان عبارة عن API بـ Node.js')
    expect(ends).toHaveLength(0)
    session.dispose()
  })

  test('2 — a pause shorter than the silence window does not submit', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('الجزء الأول', true)]))
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS - 500)
    session.feed(event([result('الجزء الثاني', true)]))
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS - 500)

    expect(ends).toHaveLength(0)
    session.dispose()
  })

  test('3 — silence after speech ends the utterance once with the full text', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('الجزء الأول', true)]))
    jest.advanceTimersByTime(1_000)
    session.feed(event([result('الجزء الثاني', true)]))
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS)

    expect(ends).toEqual([{ text: 'الجزء الأول الجزء الثاني', reason: 'silence' }])
    expect(session.ended).toBe(true)
  })

  test('4 — silence before the user speaks never ends the session', () => {
    const { ends } = makeSession()
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS * 3)
    expect(ends).toHaveLength(0)
  })

  test('5 — hard ceiling releases the microphone even mid-speech', () => {
    // Silence is disabled so only the hard ceiling can end this utterance.
    const { session, ends } = makeSession({ silenceMs: Number.MAX_SAFE_INTEGER })
    session.feed(event([result('كلام طويل جداً', true)]))
    jest.advanceTimersByTime(DEFAULT_MAX_DURATION_MS + 500)

    expect(ends).toHaveLength(1)
    expect(ends[0].reason).toBe('max-duration')
    expect(ends[0].text).toContain('كلام طويل جداً')
  })

  test('6 — interim wording is visible but not submitted as a final segment alone', () => {
    const { session, partials, ends } = makeSession()
    session.feed(event([result('بفكر أعمل', false)]))
    expect(partials.at(-1)).toBe('بفكر أعمل')
    expect(ends).toHaveLength(0)

    session.feed(event([result('بفكر أعمل مشروع', true)]))
    expect(session.text).toBe('بفكر أعمل مشروع')
    session.dispose()
  })

  test('7 — interim text is preserved when the microphone ends unexpectedly', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('جزء من الإجابة', false)]))
    session.finish('service-end')

    expect(ends).toEqual([{ text: 'جزء من الإجابة', reason: 'service-end' }])
  })

  test('8 — duplicate final events are not spoken twice', () => {
    const { session } = makeSession()
    session.feed(event([result('نفس الجملة', true)]))
    session.feed(event([result('نفس الجملة', true)]))
    expect(session.text).toBe('نفس الجملة')
    session.dispose()
  })

  test('9 — resultIndex is honoured, earlier results are not re-read', () => {
    const { session } = makeSession()
    session.feed(event([result('الأول', true), result('الثاني', true)], 1))
    expect(session.text).toBe('الثاني')
    session.dispose()
  })

  test('10 — manual finish emits exactly once', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('إجابة', true)]))
    session.finish('manual')
    session.finish('silence')
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS * 2)

    expect(ends).toEqual([{ text: 'إجابة', reason: 'manual' }])
  })

  test('11 — dispose never emits a final result', () => {
    const { session, ends } = makeSession()
    session.feed(event([result('إجابة', true)]))
    session.dispose()
    session.finish()
    jest.advanceTimersByTime(DEFAULT_SILENCE_MS * 2)

    expect(ends).toHaveLength(0)
  })

  test('12 — custom silence window is respected', () => {
    const { session, ends } = makeSession({ silenceMs: 500 })
    session.feed(event([result('سريع', true)]))
    jest.advanceTimersByTime(500)
    expect(ends).toHaveLength(1)
  })

  test('13 — malformed events never throw', () => {
    const { session } = makeSession()
    expect(() => session.feed(null as never)).not.toThrow()
    expect(() => session.feed({ resultIndex: 0, results: null } as never)).not.toThrow()
    expect(() => session.feed({ resultIndex: 0, results: { length: 1, 0: null } } as never)).not.toThrow()
    expect(session.text).toBe('')
    session.dispose()
  })

  test('14 — empty finals do not create spacing artefacts', () => {
    const { session } = makeSession()
    session.feed(event([result('   ', true)]))
    session.feed(event([result('كلام', true)]))
    expect(session.text).toBe('كلام')
    session.dispose()
  })
})
