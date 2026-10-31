// Evidence-based discovery-dimension signals for the Career AI interview.
//
// The six STAGES are discovery AREAS, not mandatory sequential steps.
// An area is "touched" only when a *user* message contains a meaningful
// signal for it. Assistant messages (greeting, questions, suggestions) are
// never evidence about the user.
//
// Dimensions may be revisited freely; the displayed stage is the HIGHEST
// area touched so far. Stage 5 ("مراجعة النتائج") is reserved and never set
// automatically — it only appears when the AI delivers a CAREER_RESULT.
//
// Signals are deliberately narrow (specific Arabic phrases and word-bounded
// English terms) so unrelated wording cannot advance the tracker. For example
// the old path pattern matched "ai" inside "email" and "data" inside
// "metadata"; those false positives are gone.

export interface ConversationMessage {
  role: string
  content: string
}

// Backward-compatible alias used by local callers (route.test.ts, AIInterviewPage.tsx)
export type ChatMessage = ConversationMessage

/**
 * One regex per discovery dimension (0-4). Dimension 5 is reserved for the
 * final results payload and intentionally has no automatic signal.
 */
export const DIMENSION_SIGNALS: RegExp[] = [
  // 0 — Current experience: past/current work, projects, internships.
  /(?:خبر(?:ة|ات|تك|تي|اتي|اتك)|اشتغلت|شغلت|عملت\s+(?:في|على|مع)|مشروع(?:ي|ك|ات)?|مشاريع|تدريب|تجربة\s+عملية|\b(?:experience|internship|interned|worked\s+(?:on|at|with)|projects?)\b)/i,

  // 1 — Interests and enjoyment.
  /(?:ب(?:ت)?ستمتع|استمتعت|مستمتع|بيعجبني|بتعجبني|بحب|مهتم(?:ة)?\s*(?:ب|في)|اهتمام(?:ي|ات)?|\b(?:enjoy(?:ed|ing)?|interested\s+in|passion(?:ate)?(?:\s+about)?|love\s+(?:to|doing|working))\b)/i,

  // 2 — Skills and supporting evidence.
  /(?:مهار(?:ة|ات|تي|تك)|شهادة|كورس|(?<!م)اتعلمت|(?<!ما)تعلمت|(?<!م)بتستخدم|\b(?:skills?|frameworks?|librar(?:y|ies)|built|implemented|certif(?:ied|icate))\b)/i,

  // 3 — Path differentiation (comparing/choosing between paths), NOT merely
  // naming a technology.
  /(?:الفرق\s+بين|فرق\s+بين|أقارن|مقارنة|أفضل\s+مسار|أنسب\s+مسار|أختار\s+(?:إيه|ايه|أي)|\b(?:difference\s+between|compare|compared\s+to|versus|vs\.?|which\s+(?:one\s+)?is\s+better)\b)/i,

  // 4 — Recommendation and action plan.
  /(?:توص(?:ية|يات|يني|وا)|توصي(?!ل)|أقترح|نصيحة|نصائح|تنصح|خطة|خطط|roadmap|الخطوة\s+(?:الجاية|القادمة|التالية)|\b(?:recommend(?:ation|ed)?|advice|roadmap|next\s+steps?|action\s+plan)\b)/i,
]

/** Pure acknowledgements — they carry no evidence about the user. */
const ACK_ONLY = /^(?:نعم|أيوه|ايوه|أه|اه|تمام|ماشي|أوكي|اوكي|حسناً?|يب|لا|لأ|مش\s+عارف(?:ة)?|مش\s+متأكد(?:ة)?|idk|i\s+don'?t\s+know|ok|okay|yes|no)[\s.!،,؟?]*$/i

/**
 * True when a user message carries enough content to be treated as evidence.
 * Pure acknowledgements ("تمام", "ok", "مش عارف") are not evidence.
 */
export function isMeaningfulUserEvidence(message: ConversationMessage): boolean {
  if (!message || message.role !== 'user') return false
  const text = typeof message.content === 'string' ? message.content.trim() : ''
  if (text.length < 2) return false
  if (ACK_ONLY.test(text)) return false
  return true
}

/**
 * Concatenates only *user* messages that carry meaningful evidence.
 * Assistant output is excluded so the tracker cannot advance on the
 * assistant's own wording.
 */
export function extractUserEvidence(messages: ConversationMessage[]): string {
  if (!Array.isArray(messages)) return ''
  return messages
    .filter(isMeaningfulUserEvidence)
    .map(m => m.content.trim())
    .join('\n')
}

/**
 * Pure signal evaluation over already-filtered user text. Exported for tests.
 * Returns 0 as the baseline when nothing is touched.
 */
export function computeStageFromUserText(userText: string, totalStages: number): number {
  const safeTotal = Number.isFinite(totalStages) ? Math.floor(totalStages) : 0
  if (safeTotal <= 1) return 0

  const text = typeof userText === 'string' ? userText : ''
  if (!text.trim()) return 0

  let highest = 0
  DIMENSION_SIGNALS.forEach((re, i) => {
    if (re.test(text)) highest = i
  })

  // Cap at totalStages - 2 so the reserved results stage is never automatic.
  return Math.min(highest, safeTotal - 2)
}

/**
 * Returns the 0-based index of the highest discovery dimension touched by
 * meaningful user evidence in the conversation.
 */
export function computeDiscoveryStage(messages: ConversationMessage[], totalStages: number): number {
  return computeStageFromUserText(extractUserEvidence(messages), totalStages)
}
