// First interview turn.
//
// The greeting is built from verified server data only:
//  - `firstName` comes from the authenticated profile (`/auth/me`),
//  - `memorySummary` comes from the career-memory endpoint.
// Nothing here invents a name, a past answer or a previous recommendation: when
// data is missing the plain greeting is used unchanged.

export const GREETING_CORE =
  'خلينا نبدأ — إيه أكثر حاجة استمتعت بيها لما اشتغلت على مشروع تقني أو حاولت تحل مشكلة؟\n' +
  'احكيلي عن مثال حقيقي، حتى لو كان مشروعاً صغيراً.'

export interface GreetingInput {
  firstName?: string | null
  memorySummary?: string | null
}

/** Trim, collapse whitespace, drop control/angle characters, cap the length. */
export function sanitizeName(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return ''
  const clean = raw
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return ''
  return clean.slice(0, 40)
}

function sanitizeMemory(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return ''
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return clean.slice(0, 180)
}

export function buildGreeting(input: GreetingInput = {}): string {
  const name = sanitizeName(input.firstName)
  const memory = sanitizeMemory(input.memorySummary)

  const opening = name
    ? `مرحباً ${name}! أنا رشيد، مستشارك المهني في ديفي واي.`
    : 'مرحباً! أنا رشيد، مستشارك المهني في ديفي واي.'

  const memoryLine = memory
    ? `\nفاكر إننا اتكلمنا قبل كده عن: ${memory}\nعايز نكمل من هنا ولا نبدأ من جديد؟`
    : ''

  return `${opening}${memoryLine}\n${GREETING_CORE}`
}
