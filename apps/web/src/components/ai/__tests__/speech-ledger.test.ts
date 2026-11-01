import { createSpeechLedger } from '../speech-ledger'
import { speechKey, textHash, toSpeechText } from '../tts-text'

describe('Speech ledger — TTS idempotency', () => {
  test('1 — first claim wins, duplicate is rejected', () => {
    const ledger = createSpeechLedger()
    const key = speechKey('msg-1', 'female', 'أهلاً بيك')

    expect(ledger.shouldSpeak(key)).toBe(true)
    expect(ledger.claim(key)).toBe(true)
    expect(ledger.shouldSpeak(key)).toBe(false)
    expect(ledger.claim(key)).toBe(false)
  })

  test('2 — released key can be retried explicitly', () => {
    const ledger = createSpeechLedger()
    const key = speechKey('msg-1', 'female', 'نص')
    ledger.claim(key)
    expect(ledger.shouldSpeak(key)).toBe(false)

    ledger.release(key)
    expect(ledger.shouldSpeak(key)).toBe(true)
    expect(ledger.claim(key)).toBe(true)
  })

  test('3 — a different voice is a different key (new turns only)', () => {
    const ledger = createSpeechLedger()
    const female = speechKey('msg-1', 'female', 'نص')
    const male = speechKey('msg-1', 'male', 'نص')

    expect(ledger.claim(female)).toBe(true)
    expect(ledger.shouldSpeak(male)).toBe(true)
  })

  test('4 — edited text with the same message id is re-spoken', () => {
    const a = speechKey('msg-1', 'female', 'النص القديم')
    const b = speechKey('msg-1', 'female', 'النص الجديد')
    expect(a).not.toBe(b)
  })

  test('5 — same message, voice and text produce a stable key', () => {
    expect(speechKey('m', 'male', 'نص')).toBe(speechKey('m', 'male', 'نص'))
  })

  test('6 — reset clears every entry', () => {
    const ledger = createSpeechLedger()
    ledger.claim('a')
    ledger.claim('b')
    expect(ledger.size).toBe(2)
    ledger.reset()
    expect(ledger.size).toBe(0)
    expect(ledger.shouldSpeak('a')).toBe(true)
  })

  test('7 — the ledger is bounded', () => {
    const ledger = createSpeechLedger({ maxEntries: 2 })
    ledger.claim('a')
    ledger.claim('b')
    ledger.claim('c')
    expect(ledger.size).toBe(2)
    expect(ledger.has('a')).toBe(false)
    expect(ledger.has('c')).toBe(true)
  })
})

describe('TTS text preparation', () => {
  test('8 — machine payloads are never spoken', () => {
    const raw = 'قبل [CAREER_RESULT]{"primaryPath":"Backend"}[/CAREER_RESULT] بعد'
    expect(toSpeechText(raw)).toBe('قبل بعد')
  })

  test('9 — quiz payloads are never spoken', () => {
    expect(toSpeechText('سؤال [QUIZ_Q]{"question":"x"}[/QUIZ_Q] تاني')).toBe('سؤال تاني')
  })

  test('10 — markdown and brand name are cleaned', () => {
    expect(toSpeechText('## عنوان **مهم** و *DeveWay*')).toBe('عنوان مهم و ديفي واي')
  })

  test('11 — whitespace is collapsed', () => {
    expect(toSpeechText('سطر\n\nجديد   جدا')).toBe('سطر جديد جدا')
  })

  test('12 — non-string input is safe', () => {
    expect(toSpeechText(undefined as unknown as string)).toBe('')
    expect(toSpeechText(null as unknown as string)).toBe('')
  })

  test('13 — hash is deterministic and collision-resistant for our sample', () => {
    expect(textHash('abc')).toBe(textHash('abc'))
    expect(textHash('abc')).not.toBe(textHash('abd'))
  })
})
