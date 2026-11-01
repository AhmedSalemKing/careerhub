// Career-memory → model context.
//
// Only verified server data may enter the prompt. Every field is optional, is
// sanitized, and is dropped when empty. The instruction never asserts that the
// stored data is still current and never invents a name, path or answer.

export interface CareerMemoryPayload {
  firstName?: string | null
  summary?: string | null
  primaryPath?: string | null
  strengths?: string[] | null
  lastInterviewAt?: string | null
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function cleanList(value: unknown, maxItems = 6, maxItem = 80): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const text = clean(item, maxItem)
    if (text && !out.includes(text)) out.push(text)
    if (out.length >= maxItems) break
  }
  return out
}

/**
 * Build a system-instruction section for a returning user.
 * Returns '' when there is nothing verified to add.
 */
export function buildMemoryInstruction(memory: CareerMemoryPayload | null | undefined): string {
  if (!memory || typeof memory !== 'object') return ''

  const firstName = clean(memory.firstName, 40)
  const summary = clean(memory.summary, 300)
  const primaryPath = clean(memory.primaryPath, 80)
  const strengths = cleanList(memory.strengths)
  const lastInterviewAt = clean(memory.lastInterviewAt, 40)

  const lines: string[] = []
  if (firstName) lines.push(`- الاسم: ${firstName}`)
  if (summary) lines.push(`- ملخص من المقابلة السابقة: ${summary}`)
  if (primaryPath) lines.push(`- المسار الذي اقترحناه سابقاً: ${primaryPath}`)
  if (strengths.length > 0) lines.push(`- نقاط قوة رصدناها: ${strengths.join('، ')}`)
  if (lastInterviewAt) lines.push(`- تاريخ آخر مقابلة: ${lastInterviewAt}`)

  if (lines.length === 0) return ''

  return [
    'سياق موثّق من حساب المستخدم (من مقابلته السابقة على المنصة):',
    ...lines,
    'استخدم هذا السياق فقط لو كان مناسباً لسؤالك الحالي، واسأل المستخدم لو عايز يكمل من هنا أو يبدأ من جديد.',
    'لو المستخدم قال حاجة تخالف هذا السياق، كلامه الحالي هو المرجع. متخترعش تفاصيل مش موجودة فوق.',
  ].join('\n')
}

/** Extract the machine-readable career result payload, if present. */
export function parseCareerResult(text: unknown): Record<string, unknown> | null {
  if (typeof text !== 'string') return null
  const match = text.match(/\[CAREER_RESULT\]([\s\S]*?)\[\/CAREER_RESULT\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export interface MemoryReportPayload {
  report: Record<string, unknown>
  summary?: string
  sessionId?: string
}

/** Build the additive persistence payload from a parsed report. */
export function buildMemoryReportPayload(
  report: Record<string, unknown>,
  sessionId?: string,
): MemoryReportPayload {
  const summary = clean(report.summary, 300) || undefined
  return {
    report,
    summary,
    sessionId: clean(sessionId, 128) || undefined,
  }
}
