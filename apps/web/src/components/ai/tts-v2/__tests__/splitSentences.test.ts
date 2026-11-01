import { stripNonSpokenBlocks, splitIntoSentences } from '../splitSentences'

// All Arabic strings use \u escapes to avoid embedding invisible RTL control
// characters when the source file is saved or processed.

describe('stripNonSpokenBlocks', () => {
  test('removes CAREER_RESULT block', () => {
    expect(
      stripNonSpokenBlocks('أهلاً! [CAREER_RESULT]{"x":"y"}[/CAREER_RESULT]'),
    ).toBe('أهلاً!')
  })

  test('only CAREER_RESULT block → empty string', () => {
    expect(stripNonSpokenBlocks('[CAREER_RESULT]{...}[/CAREER_RESULT]')).toBe('')
  })

  test('removes QUIZ_Q block', () => {
    // 'سؤال. [QUIZ_Q]...[/QUIZ_Q]' → 'سؤال.'
    expect(
      stripNonSpokenBlocks('سؤال. [QUIZ_Q]بيانات[/QUIZ_Q]'),
    ).toBe('سؤال.')
  })

  test('text with no blocks is unchanged', () => {
    expect(stripNonSpokenBlocks('مرحباً بك.')).toBe('مرحباً بك.')
  })

  test('inline CAREER_RESULT stripped, surrounding text preserved', () => {
    expect(
      stripNonSpokenBlocks('النتيجة: [CAREER_RESULT]{"p":"B"}[/CAREER_RESULT] كما ذكرت.'),
    ).toBe('النتيجة: كما ذكرت.')
  })
})

describe('splitIntoSentences', () => {
  test('empty string → empty array', () => {
    expect(splitIntoSentences('')).toHaveLength(0)
  })

  test('whitespace-only → empty array', () => {
    expect(splitIntoSentences('   ')).toHaveLength(0)
  })

  test('no terminal punctuation → single segment', () => {
    // 'مرحبا كيف حالك'
    const r = splitIntoSentences('مرحبا كيف حالك')
    expect(r).toEqual(['مرحبا كيف حالك'])
  })

  // Sentences must be >= MIN_LEN (20) chars to not be merged with the previous.
  // 'أنا رشيد مستشارك المهني هنا.'  (29 chars)
  // 'وأنا سعيد بمساعدتك في ذلك اليوم.'  (33 chars)
  test('two sentences split by period', () => {
    const r = splitIntoSentences(
      'أنا رشيد مستشارك المهني هنا. وأنا سعيد بمساعدتك في ذلك اليوم.',
    )
    expect(r).toHaveLength(2)
    expect(r[0]).toContain('رشيد')   // رشيد
    expect(r[1]).toContain('سعيد')   // سعيد
  })

  // Arabic question mark ؟ (U+061F)
  // 'كيف يمكنني مساعدتك اليوم؟' (25 chars)
  // 'أنا هنا لمساعدتك في ذلك.' (24 chars)
  test('Arabic question mark ؟ splits into two segments', () => {
    const r = splitIntoSentences(
      'كيف يمكنني مساعدتك اليوم؟ أنا هنا لمساعدتك في ذلك.',
    )
    expect(r).toHaveLength(2)
  })

  // Exclamation mark
  // 'هذا رائع جداً ومميز فعلاً!' (25 chars)
  // 'سنكمل الحديث عن مستقبلك.' (24 chars)
  test('exclamation mark splits', () => {
    const r = splitIntoSentences(
      'هذا رائع جداً ومميز فعلاً! سنكمل الحديث عن مستقبلك.',
    )
    expect(r).toHaveLength(2)
  })

  test('Arabic comma ، does NOT split', () => {
    // 'أنا رشيد، مستشارك المهني في ديفي واي.'
    const r = splitIntoSentences(
      'أنا رشيد، مستشارك المهني في ديفي واي.',
    )
    expect(r).toHaveLength(1)
  })

  test('colon does NOT split', () => {
    // 'الخيارات هي: Frontend أو Backend.'
    const r = splitIntoSentences(
      'الخيارات هي: Frontend أو Backend.',
    )
    expect(r).toHaveLength(1)
  })

  test('short fragment (< 20 chars) merged into previous segment', () => {
    // Part1: 'جملة طويلة بما يكفي للتقسيم.' (28 chars ≥ 20)
    // Part2: 'آه.' (3 chars < 20) → merged
    const r = splitIntoSentences(
      'جملة طويلة بما يكفي للتقسيم. آه.',
    )
    expect(r).toHaveLength(1)
    expect(r[0]).toContain('آه')  // آه
  })

  test('CAREER_RESULT stripped before split → 1 clean segment', () => {
    const raw = 'توصيتي هي Backend Developer. [CAREER_RESULT]{"primaryPath":"Backend"}[/CAREER_RESULT]'
    const r = splitIntoSentences(stripNonSpokenBlocks(raw))
    expect(r).toHaveLength(1)
    expect(r[0]).not.toContain('CAREER_RESULT')
  })

  test('5 sentences capped at MAX_SEGS=4 (5th merged into 4th)', () => {
    // Each sentence is 25 chars, safely above MIN_LEN=20
    const five = [
      'الجملة الأولى هنا تماماً.',
      'الجملة الثانية هنا تماماً.',
      'الجملة الثالثة هنا تماماً.',
      'الجملة الرابعة هنا تماماً.',
      'الجملة الخامسة هنا تماماً.',
    ].join(' ')
    const r = splitIntoSentences(five)
    expect(r).toHaveLength(4)
    expect(r[3]).toContain('خامسة')  // خامسة
  })

  test('only structural block → empty array after strip', () => {
    const r = splitIntoSentences(stripNonSpokenBlocks('[CAREER_RESULT]{...}[/CAREER_RESULT]'))
    expect(r).toHaveLength(0)
  })

  test('800-char cap applied before split is respected', () => {
    // Build 900-char text of repeated Arabic letter 'ا' (alef)
    const longText = 'ا'.repeat(900)
    const r = splitIntoSentences(longText.slice(0, 800))
    // 800 chars, no punctuation → 1 segment
    expect(r).toHaveLength(1)
    expect(r[0].length).toBeLessThanOrEqual(800)
  })
})
