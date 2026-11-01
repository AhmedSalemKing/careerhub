// Framework-free controller for the browser SpeechRecognition lifecycle.
//
// Why this module exists
// ----------------------
// Chrome ends an `ar-EG` recognition session after ~5–7 s even with
// `continuous = true`, and it may or may not deliver a final result for the
// words spoken just before the end. The previous implementation treated
// `onend` as "the user finished", which caused:
//   • answers being submitted in the middle of a sentence,
//   • the last phrase being dropped when only an interim result existed,
//   • duplicated words after a restart,
//   • stale sessions cancelling a newer session's timers.
//
// This controller owns the whole utterance lifecycle instead of a single
// recognition session, so the hook can stay thin and the behaviour can be
// unit-tested against the real code (tests import this module directly).
//
// Browser limits we do NOT hide
// -----------------------------
// Restarting speech recognition does not guarantee gap-free capture: between
// the end of one session and `onstart` of the next the microphone is not
// recording. Words spoken inside that gap (typically a few hundred ms) cannot
// be recovered by any client-side code. This controller therefore never claims
// continuity; it preserves everything the API *did* deliver.
//
// End-of-utterance policy
// -----------------------
// A silence timer alone is not enough to decide that the user finished:
// a 4 s thinking pause in the middle of an answer looks identical. The commit
// decision therefore requires ALL of:
//   1. the user actually spoke (at least one result was seen),
//   2. the recognizer has finalised the last phrase (no pending interim),
//   3. the text looks like more than a fragment (length / segment count),
//   4. `autoSubmit` is enabled (hands-free). In manual push-to-talk mode only
//      an explicit `stop()` submits.
// Otherwise the utterance stays open and nothing is sent.

export interface SttAlternative {
  transcript: string
}

export interface SttResult {
  readonly isFinal: boolean
  readonly [i: number]: SttAlternative
}

export interface SttResultEvent {
  readonly resultIndex: number
  readonly results: {
    readonly length: number
    readonly [i: number]: SttResult
  }
}

export interface SttRecognizer {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((e: SttResultEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
  start(): void
  stop(): void
}

export type SttSessionState = 'idle' | 'listening' | 'processing'

export type SttCommitReason = 'manual' | 'silence' | 'max-duration'

export interface SttControllerOptions {
  /** Factory so every restart gets a brand-new recognition object. */
  recognizer: () => SttRecognizer
  /** Recognition language. */
  lang?: string
  /** Silence before an automatic commit (hands-free only). */
  silenceMs?: number
  /** Minimum characters for an automatic commit. */
  minCommitChars?: number
  /** Minimum final segments for an automatic commit. */
  minCommitSegments?: number
  /** Hard ceiling for one utterance; prevents a permanently open microphone. */
  maxUtteranceMs?: number
  /** How many unexpected session ends may be recovered. */
  maxRestarts?: number
  /** Delay before re-arming the recognizer (outside the `onend` call stack). */
  restartDelayMs?: number
  /** true → silence may commit (hands-free). false → only `stop()` commits. */
  autoSubmit?: boolean
  /** Called once when an utterance is committed. */
  onCommit: (text: string, reason: SttCommitReason) => void
  /** Mic/permission/start failures, in browser codes (`not-allowed`, …). */
  onError?: (code: string) => void
  /** Listening/processing/idle transitions (only on change). */
  onStateChange?: (state: SttSessionState) => void
  /** Live transcript (finals + interim) for optional UI display. */
  onPartial?: (text: string) => void
  /** Restart budget exhausted — the text is kept, the mic is released. */
  onRestartExhausted?: (text: string) => void
}

export interface SttController {
  /** Start a new utterance, optionally continuing text kept from a dead session. */
  begin(seedText?: string): void
  /** Explicit user stop: commits whatever was transcribed. */
  stop(): void
  /** Silent teardown: no commit, no state changes (clearChat / unmount). */
  cancel(): void
  /** True while a recognizer is running or a restart is scheduled. */
  readonly listening: boolean
  /** Current transcript (finals + pending interim). */
  readonly text: string
  readonly restartCount: number
  readonly disposed: boolean
}

export const PERMANENT_STT_ERRORS: readonly string[] = [
  'not-allowed',
  'audio-capture',
  'service-not-allowed',
]

// 6 s, not 2.5 s: a 4 s "thinking" pause inside an answer is common, and the
// old 2.5 s window submitted mid-thought. Silence is only ONE of the conditions
// below — the timer alone can never commit.
export const DEFAULT_SILENCE_MS = 6_000
export const DEFAULT_MIN_COMMIT_CHARS = 12
export const DEFAULT_MIN_COMMIT_SEGMENTS = 2
export const DEFAULT_MAX_UTTERANCE_MS = 180_000
export const DEFAULT_MAX_RESTARTS = 20
export const DEFAULT_RESTART_DELAY_MS = 300

/** Collapse whitespace and trim — Arabic transcripts arrive with stray spaces. */
export function normalizeSttText(raw: string): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Append a new final segment to the transcript without duplicating words.
 *
 * After a recognizer restart Chrome can re-emit the tail of the previous
 * phrase ("... في البرمجة" again). We drop the overlapping prefix so the
 * merged text reads once. A single repeated word is also de-duplicated
 * (visible double words were the most common artefact in production).
 */
export function mergeSttSegment(previous: string, next: string): string {
  const a = normalizeSttText(previous)
  const b = normalizeSttText(next)
  if (!b) return a
  if (!a) return b
  if (a.toLowerCase() === b.toLowerCase()) return a

  const aw = a.split(' ')
  const bw = b.split(' ')
  const maxOverlap = Math.min(aw.length, bw.length)
  for (let k = maxOverlap; k >= 1; k--) {
    const tail = aw.slice(aw.length - k).join(' ').toLowerCase()
    const head = bw.slice(0, k).join(' ').toLowerCase()
    if (tail === head) {
      const rest = bw.slice(k).join(' ')
      return rest ? `${a} ${rest}` : a
    }
  }
  return `${a} ${b}`
}

export function createSttController(options: SttControllerOptions): SttController {
  const silenceMs = options.silenceMs ?? DEFAULT_SILENCE_MS
  const minCommitChars = options.minCommitChars ?? DEFAULT_MIN_COMMIT_CHARS
  const minCommitSegments = options.minCommitSegments ?? DEFAULT_MIN_COMMIT_SEGMENTS
  const maxUtteranceMs = options.maxUtteranceMs ?? DEFAULT_MAX_UTTERANCE_MS
  const maxRestarts = options.maxRestarts ?? DEFAULT_MAX_RESTARTS
  const restartDelayMs = options.restartDelayMs ?? DEFAULT_RESTART_DELAY_MS
  const autoSubmit = options.autoSubmit ?? true

  let finals: string[] = []
  let finalSegmentCount = 0
  let interim = ''
  let lastWasFinal = false
  let sawSpeech = false

  let rec: SttRecognizer | null = null
  /** Bumped for every recognizer instance; stale callbacks bail out immediately. */
  let epoch = 0
  let listening = false
  let stopped = false
  let committed = false
  let disposed = false
  let restartCount = 0
  let state: SttSessionState = 'idle'

  let silenceTimer: ReturnType<typeof setTimeout> | null = null
  let restartTimer: ReturnType<typeof setTimeout> | null = null
  let ceilingTimer: ReturnType<typeof setTimeout> | null = null

  const text = () => normalizeSttText([...finals, interim].filter(Boolean).join(' '))

  const emitState = (next: SttSessionState) => {
    if (state === next) return
    state = next
    options.onStateChange?.(next)
  }

  const clearSilence = () => {
    if (silenceTimer !== null) { clearTimeout(silenceTimer); silenceTimer = null }
  }
  const clearRestart = () => {
    if (restartTimer !== null) { clearTimeout(restartTimer); restartTimer = null }
  }
  const clearCeiling = () => {
    if (ceilingTimer !== null) { clearTimeout(ceilingTimer); ceilingTimer = null }
  }
  const clearTimers = () => { clearSilence(); clearRestart(); clearCeiling() }

  const safeStopRec = () => {
    const r = rec
    rec = null
    if (!r) return
    try { r.stop() } catch { /* already stopped */ }
  }

  const isCompleteUtterance = (value: string) => {
    if (!sawSpeech) return false
    if (!lastWasFinal) return false        // recognizer still finalising → not done
    if (interim.trim()) return false       // pending interim → user still speaking
    const chars = value.length
    if (chars < minCommitChars && finalSegmentCount < minCommitSegments) return false
    return true
  }

  /**
   * Start (or restart) the silence countdown.
   *
   * Firing this timer is NOT enough to commit: the snapshot is re-checked when
   * it fires, so a phrase still being finalised, a pending interim, a fragment
   * or manual mode all leave the utterance open.
   */
  const armSilence = () => {
    if (!autoSubmit) return
    clearSilence()
    silenceTimer = setTimeout(() => {
      silenceTimer = null
      if (disposed || stopped || committed) return
      if (!isCompleteUtterance(text())) return
      commit('silence')
    }, silenceMs)
  }

  const commit = (reason: SttCommitReason) => {
    if (disposed || committed) return
    const value = text()
    if (!value) return
    committed = true
    stopped = true
    clearTimers()
    safeStopRec()
    listening = false
    emitState('processing')
    options.onCommit(value, reason)
  }

  const handleEnd = () => {
    if (disposed || committed) return
    listening = false
    clearSilence()
    if (stopped) return
    // Unexpected end (Chrome session limit, network blip). Never submit here:
    // the user has not finished speaking as far as we know.
    if (restartCount < maxRestarts) {
      restartCount += 1
      clearRestart()
      restartTimer = setTimeout(() => {
        restartTimer = null
        if (disposed || stopped || committed) return
        bind()
        // The words spoken before the session ended are already safe; if they
        // form a finished phrase, restart the silence countdown from here so a
        // hands-free answer can still end without the user pressing stop.
        if (sawSpeech) armSilence()
      }, restartDelayMs)
      return
    }
    // Budget exhausted: keep the text, release the microphone, tell the caller.
    stopped = true
    clearTimers()
    emitState('idle')
    options.onRestartExhausted?.(text())
  }

  const handleError = (code: string | undefined) => {
    if (disposed) return
    const label = code ?? 'unknown'
    if (PERMANENT_STT_ERRORS.includes(label)) {
      // Permission denied / no microphone: stop for good, keep the text.
      stopped = true
      clearTimers()
      safeStopRec()
      listening = false
      emitState('idle')
      options.onError?.(label)
      return
    }
    // Transient (`no-speech`, `network`, `aborted`): every browser we support
    // follows it with `onend`, which owns the restart decision. Reporting a
    // state change here would flicker the UI and disable hands-free.
  }

  const handleResult = (event: SttResultEvent) => {
    if (disposed || committed || stopped) return
    const results = event.results
    if (!results || typeof results.length !== 'number') return
    const start = Math.max(0, event.resultIndex ?? 0)

    let changed = false
    for (let i = start; i < results.length; i++) {
      const result = results[i]
      if (!result) continue
      const transcript = result[0]?.transcript ?? ''
      if (!transcript.trim()) continue
      if (result.isFinal) {
        const merged = mergeSttSegment(finals.join(' '), transcript)
        // Only count a real new segment (the same tail can be re-emitted
        // after a recognizer restart).
        if (merged !== finals.join(' ')) finalSegmentCount += 1
        finals = merged ? [merged] : []
        interim = ''
        lastWasFinal = true
      } else {
        interim = normalizeSttText(transcript)
        lastWasFinal = false
      }
      sawSpeech = true
      changed = true
    }
    if (!changed) return

    options.onPartial?.(text())
    armSilence()
  }

  const bind = () => {
    if (disposed || stopped || committed) return
    const instance = options.recognizer()
    const myEpoch = ++epoch
    rec = instance
    listening = true

    instance.lang = options.lang ?? 'ar-EG'
    instance.continuous = true
    instance.interimResults = true

    instance.onstart = () => {
      if (myEpoch !== epoch || disposed) return
      listening = true
      emitState('listening')
    }
    instance.onresult = e => {
      if (myEpoch !== epoch) return
      handleResult(e)
    }
    instance.onend = () => {
      if (myEpoch !== epoch) return
      handleEnd()
    }
    instance.onerror = e => {
      if (myEpoch !== epoch) return
      handleError(e?.error)
    }

    try {
      instance.start()
    } catch (err) {
      // Chrome throws InvalidStateError when start() races the previous
      // session's teardown. Retry once through the same budget instead of
      // dropping the accumulated text.
      const message = (err as Error)?.message ?? ''
      if (myEpoch !== epoch || disposed || stopped) return
      listening = false
      if (restartCount < maxRestarts) {
        restartCount += 1
        clearRestart()
        restartTimer = setTimeout(() => {
          restartTimer = null
          if (disposed || stopped || committed) return
          bind()
          if (sawSpeech) armSilence()
        }, restartDelayMs)
        return
      }
      clearTimers()
      emitState('idle')
      options.onError?.(message.includes('already') ? 'already-started' : 'start-failed')
    }
  }

  return {
    begin(seedText?: string) {
      disposed = false
      stopped = false
      committed = false
      restartCount = 0
      sawSpeech = false
      lastWasFinal = false
      interim = ''
      const seed = normalizeSttText(seedText ?? '')
      finals = seed ? [seed] : []
      clearTimers()
      bind()
      // Hard ceiling so a forgotten microphone cannot record forever.
      ceilingTimer = setTimeout(() => {
        ceilingTimer = null
        if (disposed || stopped || committed) return
        commit('max-duration')
      }, maxUtteranceMs)
    },

    stop() {
      if (disposed) return
      stopped = true
      clearTimers()
      safeStopRec()
      listening = false
      const value = text()
      if (!committed && value) {
        committed = true
        emitState('processing')
        options.onCommit(value, 'manual')
        return
      }
      emitState('idle')
    },

    cancel() {
      if (disposed) return
      stopped = true
      committed = true
      disposed = true
      clearTimers()
      safeStopRec()
      listening = false
    },

    get listening() { return listening },
    get text() { return text() },
    get restartCount() { return restartCount },
    get disposed() { return disposed },
  }
}
