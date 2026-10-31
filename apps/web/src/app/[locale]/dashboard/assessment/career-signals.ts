// Evidence-based discovery-dimension signals for the Career AI interview.
//
// The six STAGES are discovery AREAS, not mandatory sequential steps.
// Each area is "touched" when conversation text contains signals for it.
// Dimensions may be revisited; the stage display reflects the HIGHEST touched so far.
// Stage 5 ("مراجعة النتائج") is reserved and never set automatically — it only
// appears when the AI delivers a CAREER_RESULT payload.

export const DIMENSION_SIGNALS: RegExp[] = [
  // 0 — Current experience
  /خبر|مشروع|مشاريع|اشتغلت|عملت|جربت|حاولت|تجربة/i,
  // 1 — Interests and enjoyment
  /بتحب|بيعجبك|مستمتع|اهتمام|استمتعت|بتستمتع/i,
  // 2 — Skills and supporting evidence  (مهار covers مهارة + مهارات)
  /مهار|بتعرف|بتعمل|تقدر|أداة|framework|library|بتستخدم/i,
  // 3 — Path differentiation
  /مسار|فرق|أنسب|تفضل|data|devops|mobile|frontend|backend|ml|ai/i,
  // 4 — Recommendation and action plan
  /توصية|نصيحة|خطة|roadmap|أقترح|recommend/i,
]

/**
 * Returns 0-based index of the highest discovery dimension whose signal
 * appears anywhere in conversationText.  Capped at totalStages-2 so the
 * final "results" stage (index totalStages-1) is never set automatically.
 */
export function computeDiscoveryStage(conversationText: string, totalStages: number): number {
  const touched = DIMENSION_SIGNALS.map(re => re.test(conversationText))
  const highest = touched.reduce((hi, hit, i) => (hit ? i : hi), 0)
  return Math.min(highest, totalStages - 2)
}
