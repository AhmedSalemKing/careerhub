// Long-form speech-to-text session.
//
// The browser SpeechRecognition API is unreliable for interview-length answers:
//  - `continuous = false` stops at the first short silence,
//  - `interimResults = false` throws away partial wording,
//  - a single `onresult` read misses earlier result indices.
//
// This module keeps a single utterance alive across recognizer restarts:
//  - every final segment is accumulated (nothing is overwritten),
//  - interim wording is shown but never submitted alone,
//  - end-of-speech is decided by a silence timer (default 2.5 s) that is reset
//    on every new result, so natural pauses do not submit the answer,
//  - a hard ceiling (default 120 s) guarantees the microphone is released,
//  - `finish()` lets the caller submit manually at any moment.
//
// It is deliberately framework-free so it can be unit-tested with fake timers.
// The hook owns the actual recognizer; this module only owns utterance state.

export interface SttAlternative {
  transcript: string
}

export interface SttResult {
  readonly isFinal: boolean
  readonly length?: number
  readonly [i: number]: SttAlternative
}

export interface SttResultEvent {
  readonly resultIndex: number
  readonly results: {
    readonly length: number
    readonly [i: number]: SttResult
  }
}

export type SttEndReason = 'silence' | 'max-duration' | 'manual' | 'service-end'

export interface SttSessionOptions {
  /** Silence after the last speech result that ends the utterance. */
  silenceMs?: number
  /** Absolute maximum utterance length. */
  maxDurationMs?: number
  /** How often the silence / max-duration clock is checked. */
  tickMs?: number
  /** Injectable clock (tests). */
  now?: () => number
  /** Called whenever the visible transcript changes (interim included). */
  onPartial?: (text: string) => void
  /** Called exactly once when the utterance ends. */
  onEnd: (text: string, reason: SttEndReason) => void
}

export interface SttSession {
  /** Feed one browser `onresult` event. */
  feed(event: SttResultEvent): void
  /** End the utterance now, emitting whatever has been transcribed. */
  finish(reason?: SttEndReason): void
  /** Stop without emitting `onEnd` (teardown / cancel). */
  dispose(): void
  readonly text: string
  readonly hasSpeech: boolean
  readonly ended: boolean
}

export const DEFAULT_SILENCE_MS = 2_500
export const DEFAULT_MAX_DURATION_MS = 120_000
export const DEFAULT_TICK_MS = 250

/** Collapse whitespace, trim, and drop exact consecutive duplicate segments. */
export function normalizeTranscript(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

export function joinSegments(segments: readonly string[], interim = ''): string {
  const out: string[] = []
  for (const segment of [...segments, interim]) {
    const clean = normalizeTranscript(segment ?? '')
    if (!clean) continue
    if (out.length > 0 && out[out.length - 1].toLowerCase() === clean.toLowerCase()) continue
    out.push(clean)
  }
  return normalizeTranscript(out.join(' '))
}

function safeTranscript(result: SttResult | undefined): string {
  if (!result) return ''
  const first = result[0]
  return typeof first?.transcript === 'string' ? first.transcript : ''
}

export function createSttSession(options: SttSessionOptions): SttSession {
  const silenceMs = options.silenceMs ?? DEFAULT_SILENCE_MS
  const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_DURATION_MS
  const tickMs = options.tickMs ?? DEFAULT_TICK_MS
  const now = options.now ?? (() => Date.now())

  const startedAt = now()
  let lastActivityAt = startedAt
  let sawResult = false
  let ended = false

  const finals: string[] = []
  let interim = ''
  let lastEmitted = ''

  const getText = () => joinSegments(finals, interim)

  const emitPartial = () => {
    const text = getText()
    if (text === lastEmitted) return
    lastEmitted = text
    options.onPartial?.(text)
  }

  const clearClock = () => {
    if (ticker !== null) {
      clearInterval(ticker)
      ticker = null
    }
  }

  const finish = (reason: SttEndReason = 'manual') => {
    if (ended) return
    ended = true
    clearClock()
    const text = getText()
    interim = ''
    lastEmitted = text
    options.onEnd(text, reason)
  }

  const tick = () => {
    if (ended) return
    const at = now()
    if (at - startedAt >= maxDurationMs) {
      finish('max-duration')
      return
    }
    // Only a real speech result may end the utterance. If the user has not
    // spoken yet, the session keeps waiting for the hard ceiling.
    if (sawResult && at - lastActivityAt >= silenceMs) finish('silence')
  }

  let ticker: ReturnType<typeof setInterval> | null = null
  if (typeof setInterval === 'function') {
    ticker = setInterval(tick, tickMs)
    // Never keep a Node.js process (or a test runner) alive because of this.
    const maybeUnref = ticker as unknown as { unref?: () => void }
    maybeUnref.unref?.()
  }

  return {
    feed(event) {
      if (ended || !event) return
      const results = event.results
      if (!results || typeof results.length !== 'number') return
      const start = Math.max(0, event.resultIndex ?? 0)
      let changed = false

      for (let i = start; i < results.length; i++) {
        const result = results[i]
        if (!result) continue
        const transcript = safeTranscript(result)
        if (!transcript) continue

        if (result.isFinal) {
          const clean = normalizeTranscript(transcript)
          const previous = finals[finals.length - 1]
          if (clean && previous?.toLowerCase() !== clean.toLowerCase()) {
            finals.push(clean)
          }
          // A final result supersedes the interim wording.
          interim = ''
          sawResult = true
          changed = true
        } else {
          interim = transcript
          sawResult = true
          changed = true
        }
      }

      if (changed) {
        lastActivityAt = now()
        emitPartial()
      }
    },

    finish(reason = 'manual') {
      finish(reason)
    },

    dispose() {
      if (ended) return
      ended = true
      clearClock()
      interim = ''
    },

    get text() {
      return getText()
    },

    get hasSpeech() {
      return getText().length > 0
    },

    get ended() {
      return ended
    },
  }
}
