// Evidence-based discovery-dimension signals for the Career AI interview.
//
// The six STAGES are discovery AREAS, not mandatory sequential steps.
// Each area is "touched" when conversation text contains signals for it.
// Dimensions may be revisited; the stage display reflects the HIGHEST touched so far.
// Stage 5 ("مراجعة النتائج") is reserved and never set automatically — it only
// appears when the AI delivers a CAREER_RESULT payload.

export interface ChatMessage {
  role: string
  content: string
}

export const DIMENSION_SIGNALS: RegExp[] = [
  // 0 — Current experience (خبرة|خبرتي|خبرات avoids خبر matching أخبرني/أخبار)
  /خبرة|خبرتي|خبرات|مشروع|مشاريع|اشتغلت|عملت|جربت|حاولت|تجربة/i,
  // 1 — Interests and enjoyment
  /بتحب|بيعجبك|مستمتع|اهتمام|استمتعت|بتستمتع/i,
  // 2 — Skills and concrete tools (مهار covers مهارة + مهارات)
  /مهار|بتعرف|بتعمل|تقدر|أداة|framework|library|بتستخدم/i,
  // 3 — Path differentiation — \b word boundaries prevent substring matches (e.g. "email" ≠ "ml")
  /مسار|فرق|أنسب|تفضل|\bdata\b|\bdevops\b|\bmobile\b|\bfrontend\b|\bbackend\b|\bml\b|\bai\b/i,
  // 4 — Recommendation and action plan
  /توصية|نصيحة|خطة|\broadmap\b|أقترح|\brecommend\b/i,
]

/**
 * Returns 0-based index of the highest discovery dimension whose signal
 * appears in user messages only.  Capped at totalStages-2 so the
 * final "results" stage (index totalStages-1) is never set automatically.
 */
export function computeDiscoveryStage(messages: ChatMessage[], totalStages: number): number {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n')
  const touched = DIMENSION_SIGNALS.map(re => re.test(userText))
  const highest = touched.reduce((hi, hit, i) => (hit ? i : hi), 0)
  return Math.min(highest, totalStages - 2)
}
