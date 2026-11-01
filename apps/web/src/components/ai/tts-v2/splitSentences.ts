// Client-side sentence splitting for the sentence-level TTS pipeline.
//
// stripNonSpokenBlocks mirrors ONLY the structural block removal that the
// server's cleanText() also does. It runs before splitting so structural
// markers are never treated as sentence boundaries.
//
// Server-side cleanText() is authoritative for the full text cleanup
// (markdown, DeveWay → ديفي واي, 800-char cap). These helpers run on the
// already-cleaned text that useAIChat.speak() passes in, and again as a
// safety net inside speak() before splitting.

export function stripNonSpokenBlocks(text: string): string {
  return text
    .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
    .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Splits cleaned text into 1–MAX_SEGS sentences for independent TTS requests.
//
// Splits ONLY on terminal punctuation (. ! ? ؟) followed by whitespace.
// Does NOT split on Arabic comma ، or colon — those mark pauses within a
// sentence, not boundaries.
//
// Short fragments (< MIN_LEN) are merged into the preceding sentence to
// avoid sending near-empty requests that would waste a round-trip.
export function splitIntoSentences(text: string): string[] {
  const MIN_LEN = 20
  const MAX_SEGS = 4
  const trimmed = text.trim()
  if (!trimmed) return []

  const parts = trimmed.split(/(?<=[.!?؟])\s+/)
  const segs: string[] = []

  for (const raw of parts) {
    const p = raw.trim()
    if (!p) continue

    if (segs.length >= MAX_SEGS) {
      segs[segs.length - 1] += ' ' + p
      continue
    }
    if (segs.length > 0 && p.length < MIN_LEN) {
      segs[segs.length - 1] += ' ' + p
    } else {
      segs.push(p)
    }
  }

  return segs.length > 0 ? segs : [trimmed]
}
