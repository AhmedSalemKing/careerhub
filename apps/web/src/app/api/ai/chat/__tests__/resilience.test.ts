/**
 * Phase 4 — resilience tests for the chat pipeline modules.
 *
 * All provider behaviour is mocked: no live API key is used and no quota is
 * consumed. These tests cover the four failure modes that broke long
 * interviews:
 *   1. history growth/truncation (continuity),
 *   2. duplicate submissions on retry (idempotency),
 *   3. provider transport failures (timeout / HTTP / malformed body),
 *   4. memory prompt injection (sanitization + no invented facts).
 */
import {
  buildContents,
  DEFAULT_MAX_CHARS,
  DEFAULT_MAX_MESSAGE_CHARS,
  DEFAULT_MAX_TURNS,
} from '../continuity'
import {
  createIdempotencyStore,
  isValidRequestId,
} from '../idempotency'
import { callGeminiModel } from '../provider'
import {
  buildMemoryInstruction,
  buildMemoryReportPayload,
  parseCareerResult,
} from '../memory-context'

// ── continuity ──────────────────────────────────────────────────────────────

function turn(role: 'user' | 'assistant', content: string) {
  return { role, content }
}

describe('Conversation continuity', () => {
  test('1 — a short conversation is passed through unchanged', () => {
    const raw = [turn('user', 'أهلاً'), turn('assistant', 'أهلاً بيك')]
    const built = buildContents(raw)

    expect(built.trimmed).toBe(false)
    expect(built.droppedMessages).toBe(0)
    expect(built.contents).toEqual([
      { role: 'user', parts: [{ text: 'أهلاً' }] },
      { role: 'model', parts: [{ text: 'أهلاً بيك' }] },
      // Gemini requires the conversation to end with a user turn.
      { role: 'user', parts: [{ text: 'أكمل' }] },
    ])
  })

  test('2 — the newest turns survive and the oldest are dropped', () => {
    const raw: { role: 'user' | 'assistant'; content: string }[] = []
    for (let i = 0; i < 60; i++) raw.push(turn(i % 2 === 0 ? 'user' : 'assistant', `رسالة ${i}`))

    const built = buildContents(raw, { maxTurns: 10 })
    const flat = built.contents.map(c => c.parts.map(p => p.text).join(' ')).join('')

    expect(built.trimmed).toBe(true)
    expect(built.droppedMessages).toBeGreaterThan(0)
    expect(flat).toContain('رسالة 59')
    expect(flat).not.toContain('رسالة 0 ')
  })

  test('3 — character budget is enforced even with few turns', () => {
    const big = 'ا'.repeat(DEFAULT_MAX_CHARS)
    const raw = [turn('user', big), turn('assistant', big), turn('user', 'سؤال أخير')]

    const built = buildContents(raw, { maxTurns: 100 })
    const total = built.contents.reduce(
      (sum, c) => sum + c.parts.reduce((s, p) => s + p.text.length, 0),
      0,
    )

    // The last user turn must always survive.
    expect(built.contents[built.contents.length - 1].parts[0].text).toContain('سؤال أخير')
    expect(total).toBeLessThanOrEqual(DEFAULT_MAX_CHARS + 200)
    expect(built.trimmed).toBe(true)
  })

  test('4 — a single very long answer is truncated from the middle, both ends kept', () => {
    const head = 'بداية الإجابة. '
    const tail = 'نهاية الإجابة.'
    const long = head + 'تفاصيل '.repeat(5_000) + tail

    const built = buildContents([turn('user', long), turn('assistant', 'تمام')], {
      maxMessageChars: 1_000,
    })

    const first = built.contents[0].parts[0].text
    expect(first.length).toBeLessThanOrEqual(1_000 + 10)
    expect(first.startsWith('بداية الإجابة.')).toBe(true)
    expect(first.endsWith('نهاية الإجابة.')).toBe(true)
    expect(first).toContain('…')
    expect(built.truncatedMessages).toBe(1)
  })

  test('5 — conversation always starts with a user turn', () => {
    const raw = [turn('assistant', 'كلام المساعد'), turn('user', 'رد المستخدم')]
    const built = buildContents(raw)

    expect(built.contents[0].role).toBe('user')
    expect(built.contents[built.contents.length - 1].role).toBe('user')
  })

  test('6 — conversation always ends with a user turn', () => {
    const raw = [turn('user', 'سؤال'), turn('assistant', 'إجابة')]
    const built = buildContents(raw)

    expect(built.contents[built.contents.length - 1].role).toBe('user')
  })

  test('7 — consecutive same-role messages are merged', () => {
    const raw = [
      turn('user', 'الجزء الأول'),
      turn('user', 'الجزء الثاني'),
      turn('assistant', 'تمام'),
      turn('user', 'سؤال'),
    ]
    const built = buildContents(raw)

    expect(built.contents).toHaveLength(3)
    expect(built.contents[0].parts[0].text).toContain('الجزء الأول')
    expect(built.contents[0].parts[0].text).toContain('الجزء الثاني')
  })

  test('8 — malformed input is ignored, never thrown', () => {
    expect(buildContents(null).contents).toEqual([])
    expect(buildContents('nope').contents).toEqual([])
    expect(buildContents([null, {}, { role: 'user' }, { role: 'user', content: '   ' }]).contents).toEqual([])
    expect(buildContents([{ role: 'user', content: 42 }]).contents).toEqual([])
  })

  test('9 — the default turn budget matches the documented value', () => {
    expect(DEFAULT_MAX_TURNS).toBe(48)
    expect(DEFAULT_MAX_MESSAGE_CHARS).toBe(6_000)
  })
})

// ── idempotency ─────────────────────────────────────────────────────────────

describe('Request idempotency', () => {
  test('1 — concurrent calls with the same key execute once', async () => {
    const store = createIdempotencyStore()
    const fn = jest.fn(async () => {
      await new Promise(r => setTimeout(r, 10))
      return { content: 'إجابة', isError: false }
    })

    const [a, b, c] = await Promise.all([
      store.run('req-12345678', fn),
      store.run('req-12345678', fn),
      store.run('req-12345678', fn),
    ])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
    expect(b).toEqual(c)
  })

  test('2 — different keys execute independently', async () => {
    const store = createIdempotencyStore()
    const fn = jest.fn(async (id: string) => ({ content: id }))

    const [a, b] = await Promise.all([
      store.run('req-aaaaaaaa', () => fn('a')),
      store.run('req-bbbbbbbb', () => fn('b')),
    ])

    expect(fn).toHaveBeenCalledTimes(2)
    expect(a.content).toBe('a')
    expect(b.content).toBe('b')
  })

  test('3 — a repeated call after success replays the stored result', async () => {
    const store = createIdempotencyStore()
    const fn = jest.fn(async () => ({ content: 'once' }))

    const first = await store.run('req-replay01', fn)
    const second = await store.run('req-replay01', fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
  })

  test('4 — a failed execution releases the key so a real retry can run', async () => {
    const store = createIdempotencyStore()
    let calls = 0
    const flaky = async () => {
      calls++
      if (calls === 1) throw new Error('boom')
      return { content: 'ok' }
    }

    await expect(store.run('req-failure01', flaky)).rejects.toThrow('boom')
    const result = await store.run('req-failure01', flaky)

    expect(calls).toBe(2)
    expect(result.content).toBe('ok')
  })

  test('5 — entries expire after the TTL and execute again', async () => {
    let clock = 0
    const store = createIdempotencyStore({ ttlMs: 1_000, now: () => clock })
    const fn = jest.fn(async () => ({ content: 'x' }))

    await store.run('req-ttl000001', fn)
    clock = 500
    await store.run('req-ttl000001', fn)
    expect(fn).toHaveBeenCalledTimes(1)

    clock = 1_500
    await store.run('req-ttl000001', fn)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('6 — the store is bounded by maxEntries', async () => {
    const store = createIdempotencyStore({ maxEntries: 2 })
    const fn = async () => ({ content: 'x' })

    await store.run('req-bound001', fn)
    await store.run('req-bound002', fn)
    expect(store.size).toBe(2)
    await store.run('req-bound003', fn)
    expect(store.size).toBe(2)
  })

  test('7 — only well-formed client request ids are accepted', () => {
    expect(isValidRequestId('abc12345-6789')).toBe(true)
    expect(isValidRequestId('A_b-12345678')).toBe(true)
    expect(isValidRequestId('short')).toBe(false)
    expect(isValidRequestId('has space 1234')).toBe(false)
    expect(isValidRequestId('../../etc/passwd')).toBe(false)
    expect(isValidRequestId(12345)).toBe(false)
    expect(isValidRequestId(null)).toBe(false)
    expect(isValidRequestId('x'.repeat(200))).toBe(false)
  })
})

// ── provider ────────────────────────────────────────────────────────────────

const realFetch = global.fetch

function mockFetch(impl: () => Promise<unknown>) {
  global.fetch = jest.fn(impl) as unknown as typeof fetch
}

function response(status: number, payload: unknown, ok = status >= 200 && status < 300) {
  return {
    ok,
    status,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    json: async () => payload,
  }
}

const baseArgs = {
  apiKey: 'test-key',
  model: 'gemini-3.8-flash',
  contents: [{ role: 'user' as const, parts: [{ text: 'مرحبا' }] }],
  timeoutMs: 1_000,
  includeSystemInstruction: false,
}

afterEach(() => {
  global.fetch = realFetch
  jest.useRealTimers()
})

describe('Gemini provider attempts', () => {
  test('1 — a successful body yields the first candidate text', async () => {
    mockFetch(async () => response(200, { candidates: [{ content: { parts: [{ text: 'أهلاً' }] } }] }))

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('success')
    if (attempt.kind === 'success') expect(attempt.text).toBe('أهلاً')
  })

  test('2 — a successful body with no text is a success with an empty string', async () => {
    mockFetch(async () => response(200, { candidates: [] }))

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('success')
    if (attempt.kind === 'success') expect(attempt.text).toBe('')
  })

  test('3 — HTTP 429 is reported with its status and body for classification', async () => {
    const body = { error: { message: 'Quota exceeded' } }
    mockFetch(async () => response(429, body))

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('http')
    if (attempt.kind === 'http') {
      expect(attempt.status).toBe(429)
      expect(attempt.bodyText).toContain('Quota exceeded')
    }
  })

  test('4 — HTTP 503 is reported as an http attempt', async () => {
    mockFetch(async () => response(503, 'unavailable'))

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('http')
    if (attempt.kind === 'http') expect(attempt.status).toBe(503)
  })

  test('5 — an aborted request is reported as a timeout', async () => {
    mockFetch(() => new Promise((_, reject) => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      setTimeout(() => reject(err), 0)
    }))

    const attempt = await callGeminiModel({ ...baseArgs, timeoutMs: 20 })

    expect(attempt.kind).toBe('timeout')
  })

  test('6 — a thrown network error is reported as an error attempt', async () => {
    mockFetch(async () => { throw new Error('network down') })

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('error')
    if (attempt.kind === 'error') expect(attempt.message).toContain('network down')
  })

  test('7 — an invalid JSON body becomes an error attempt, not a crash', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => 'not-json',
      json: async () => { throw new SyntaxError('Unexpected token') },
    }))

    const attempt = await callGeminiModel(baseArgs)

    expect(attempt.kind).toBe('error')
  })

  test('8 — the request targets the documented Gemini endpoint with the model name', async () => {
    let seenUrl = ''
    const spy = jest.fn(async (url: unknown) => {
      seenUrl = String(url)
      return response(200, { candidates: [{ content: { parts: [{ text: 'x' }] } }] })
    })
    global.fetch = spy as unknown as typeof fetch

    await callGeminiModel(baseArgs)

    expect(seenUrl).toContain('models/gemini-3.8-flash:generateContent')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('9 — a system instruction is only sent when explicitly requested', async () => {
    const spy = jest.fn(async () => response(200, { candidates: [{ content: { parts: [{ text: 'x' }] } }] }))
    global.fetch = spy as unknown as typeof fetch

    const lastBody = () => {
      const calls = spy.mock.calls as unknown as [unknown, { body: string }][]
      return JSON.parse(calls[calls.length - 1][1].body)
    }

    await callGeminiModel({ ...baseArgs, includeSystemInstruction: false, systemInstruction: 'sys' })
    const bodyWithout = lastBody()

    await callGeminiModel({ ...baseArgs, includeSystemInstruction: true, systemInstruction: 'sys' })
    const bodyWith = lastBody()

    expect(bodyWithout.system_instruction).toBeUndefined()
    expect(bodyWith.system_instruction).toEqual({ parts: [{ text: 'sys' }] })
  })
})

// ── memory context ──────────────────────────────────────────────────────────

describe('Memory context', () => {
  test('1 — no memory produces no instruction block', () => {
    expect(buildMemoryInstruction(null)).toBe('')
    expect(buildMemoryInstruction(undefined)).toBe('')
    expect(buildMemoryInstruction({})).toBe('')
    expect(buildMemoryInstruction({ firstName: '   ', summary: '' })).toBe('')
  })

  test('2 — verified fields are included', () => {
    const block = buildMemoryInstruction({
      firstName: 'سارة',
      summary: 'مهتمة بالـ Backend',
      primaryPath: 'Backend Developer',
      strengths: ['تحليل المشاكل', 'Node.js'],
    })

    expect(block).toContain('سارة')
    expect(block).toContain('Backend Developer')
    expect(block).toContain('تحليل المشاكل')
    expect(block).toContain('Backend Developer')
  })

  test('3 — control characters and HTML-ish content cannot break the prompt', () => {
    const block = buildMemoryInstruction({
      firstName: 'سارة\n\u0000<script>',
      summary: 'ملخص\u0007\n\nنص',
    })

    expect(block).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/)
    expect(block).toContain('سارة')
  })

  test('4 — values are length-capped', () => {
    const block = buildMemoryInstruction({
      firstName: 'ن'.repeat(500),
      summary: 'م'.repeat(5_000),
      primaryPath: 'ب'.repeat(500),
      strengths: Array.from({ length: 50 }, (_, i) => ` مهارة ${i} `),
    })

    // 40 + prefix + 300 + 80 + strengths, comfortably bounded.
    expect(block.length).toBeLessThan(2_000)
  })

  test('5 — duplicate and blank strengths are removed', () => {
    const block = buildMemoryInstruction({ strengths: ['Node', 'Node', '  ', '', 'SQL'] })
    expect(block).toContain('Node، SQL')
    expect(block.split('Node').length - 1).toBe(1)
  })

  test('6 — the instruction never claims the stored data is current', () => {
    const block = buildMemoryInstruction({ summary: 'مسار Backend' })
    expect(block).not.toContain('مؤكد')
    expect(block).not.toContain('دائماً')
    expect(block).toContain('لو المستخدم قال حاجة تخالف هذا السياق')
  })

  test('7 — CAREER_RESULT is parsed only when the payload is valid JSON', () => {
    const good = 'نص عادي [CAREER_RESULT]{"primaryPath":"Backend Developer","matchScore":80}[/CAREER_RESULT]'
    expect(parseCareerResult(good)).toEqual({ primaryPath: 'Backend Developer', matchScore: 80 })

    expect(parseCareerResult('بدون بلوك')).toBeNull()
    expect(parseCareerResult('[CAREER_RESULT]{not json}[/CAREER_RESULT]')).toBeNull()
    expect(parseCareerResult('[CAREER_RESULT][1,2][/CAREER_RESULT]')).toBeNull()
    expect(parseCareerResult(undefined)).toBeNull()
  })

  test('8 — the persistence payload keeps the report and caps the summary', () => {
    const report = { primaryPath: 'Backend Developer', summary: 'س'.repeat(1_000) }
    const payload = buildMemoryReportPayload(report, 'session-1')

    expect(payload.report).toEqual(report)
    expect(payload.summary?.length).toBe(300)
    expect(payload.sessionId).toBe('session-1')
  })

  test('9 — an invalid session id is dropped', () => {
    const payload = buildMemoryReportPayload({ primaryPath: 'x' }, '   ')
    expect(payload.sessionId).toBeUndefined()
  })
})
