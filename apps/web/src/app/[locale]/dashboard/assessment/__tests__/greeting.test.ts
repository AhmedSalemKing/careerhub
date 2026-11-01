import { buildGreeting, GREETING_CORE, sanitizeName } from '../greeting'

describe('Interview greeting', () => {
  test('1 — without a name the greeting introduces Rasheed', () => {
    const text = buildGreeting()
    expect(text).toContain('مرحباً! أنا رشيد، مستشارك المهني في ديفي واي.')
    expect(text).toContain(GREETING_CORE)
  })

  test('2 — verified first name is used', () => {
    expect(buildGreeting({ firstName: 'سارة' })).toContain('مرحباً سارة!')
  })

  test('3 — whitespace-only or missing names fall back safely', () => {
    expect(buildGreeting({ firstName: '   ' })).not.toContain('مرحباً  !')
    expect(buildGreeting({ firstName: null })).toContain('مرحباً!')
    expect(buildGreeting({ firstName: undefined })).toContain('مرحباً!')
  })

  test('4 — names are sanitized and capped', () => {
    expect(sanitizeName('<script>alert(1)</script>')).toBe('script alert(1) /script')
    expect(sanitizeName('أحمد\nمحمد')).toBe('أحمد محمد')
    expect(sanitizeName('x'.repeat(100)).length).toBe(40)
  })

  test('5 — memory summary is included only when present', () => {
    expect(buildGreeting({ firstName: 'علي', memorySummary: 'بيحب الـ Backend' }))
      .toContain('فاكر إننا اتكلمنا قبل كده عن: بيحب الـ Backend')
    expect(buildGreeting({ firstName: 'علي' })).not.toContain('فاكر إننا')
  })

  test('6 — memory summary is capped and whitespace-normalized', () => {
    const text = buildGreeting({ memorySummary: `  ${'ك'.repeat(400)}  ` })
    const line = text.split('\n').find(l => l.includes('فاكر إننا')) ?? ''
    // 180-char memory cap + the fixed "فاكر إننا..." prefix
    expect(line.length).toBeLessThanOrEqual(220)
  })

  test('7 — the core question is always the last instruction', () => {
    const text = buildGreeting({ firstName: 'منى', memorySummary: 'مسار Backend' })
    expect(text.endsWith(GREETING_CORE)).toBe(true)
  })

  test('8 — no invented facts when only a name is known', () => {
    const text = buildGreeting({ firstName: 'منى' })
    expect(text).not.toContain('مقابلتك السابقة')
    expect(text).not.toContain('Backend')
  })
})
