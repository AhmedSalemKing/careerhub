// Conversation continuity for long interviews.
//
// A 30-minute interview produces far more history than one provider request can
// safely carry. Sending everything risks request-size errors, provider timeouts
// and 429s exactly when the conversation matters most. This module keeps the
// most recent turns within an explicit budget, truncates individual over-long
// answers from the middle (head + tail), and preserves the provider's required
// first-user / last-user shape.
//
// Pure and dependency-free.

export interface ChatTurnInput {
  role?: unknown
  content?: unknown
}

export interface GeminiContent {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface BuildContentsOptions {
  /** Maximum number of individual messages kept (before role merging). */
  maxTurns?: number
  /** Maximum total characters kept across all messages. */
  maxChars?: number
  /** Maximum characters for a single message before middle truncation. */
  maxMessageChars?: number
}

export interface BuildContentsResult {
  contents: GeminiContent[]
  /** True when anything was dropped or truncated. */
  trimmed: boolean
  droppedMessages: number
  truncatedMessages: number
}

export const DEFAULT_MAX_TURNS = 48
export const DEFAULT_MAX_CHARS = 24_000
export const DEFAULT_MAX_MESSAGE_CHARS = 6_000

interface PreparedTurn {
  role: 'user' | 'model'
  content: string
  truncated: boolean
}

function truncateMiddle(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false }
  const tailLength = Math.max(200, Math.floor(max * 0.3))
  const headLength = Math.max(200, max - tailLength)
  return {
    text: `${text.slice(0, headLength)}\n…\n${text.slice(-tailLength)}`,
    truncated: true,
  }
}

function prepare(raw: unknown, maxMessageChars: number): PreparedTurn[] {
  if (!Array.isArray(raw)) return []
  const out: PreparedTurn[] = []
  for (const item of raw as ChatTurnInput[]) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.content !== 'string' || item.content.trim().length === 0) continue
    const { text, truncated } = truncateMiddle(item.content, maxMessageChars)
    out.push({
      role: item.role === 'assistant' ? 'model' : 'user',
      content: text,
      truncated,
    })
  }
  return out
}

export function buildContents(
  raw: unknown,
  options: BuildContentsOptions = {},
): BuildContentsResult {
  const maxTurns = options.maxTurns ?? DEFAULT_MAX_TURNS
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS
  const maxMessageChars = options.maxMessageChars ?? DEFAULT_MAX_MESSAGE_CHARS

  const prepared = prepare(raw, maxMessageChars)
  const truncatedMessages = prepared.filter(t => t.truncated).length

  let start = 0
  let totalChars = prepared.reduce((sum, turn) => sum + turn.content.length, 0)

  while (
    start < prepared.length - 1 &&
    (prepared.length - start > maxTurns || totalChars > maxChars)
  ) {
    totalChars -= prepared[start].content.length
    start++
  }

  const kept = prepared.slice(start)
  const contents: GeminiContent[] = []
  let lastRole: 'user' | 'model' | '' = ''

  for (const turn of kept) {
    if (turn.role === lastRole) {
      const prev = contents[contents.length - 1]
      prev.parts = [{ text: `${prev.parts.map(p => p.text).join('\n')}\n${turn.content}` }]
    } else {
      contents.push({ role: turn.role, parts: [{ text: turn.content }] })
      lastRole = turn.role
    }
  }

  // Gemini requires the conversation to start with a user turn and end with
  // one. Synthetic prompts are only role placeholders, never facts.
  if (contents.length > 0 && contents[0].role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: 'مرحبا' }] })
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
    contents.push({ role: 'user', parts: [{ text: 'أكمل' }] })
  }

  return {
    contents,
    trimmed: start > 0 || truncatedMessages > 0,
    droppedMessages: start,
    truncatedMessages,
  }
}
