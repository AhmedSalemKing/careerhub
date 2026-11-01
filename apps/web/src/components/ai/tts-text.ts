// Text preparation for TTS plus the stable key used by the speech ledger.

/** Remove machine-readable payloads and Markdown noise before speaking. */
export function toSpeechText(raw: string): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
    .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/DeveWay/gi, 'ديفي واي')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Small, stable, non-cryptographic hash (djb2). */
export function textHash(text: string): string {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

/**
 * Stable identity of one spoken turn.
 *
 * Text is included so an edited message with the same id is re-spoken, while
 * an unchanged message is never re-spoken for the same voice.
 */
export function speechKey(messageId: string, voice: string, text: string): string {
  return `${messageId}|${voice}|${textHash(text)}`
}
