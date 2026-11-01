// Framework-free pieces of the TTS playback lifecycle.
//
// `useStreamingTTS` is a React hook, and this project has no React test
// renderer, so the decisions that must never regress live here and are unit
// tested directly (tests import this module, not a copy of its logic):
//
//   • RequestGuard — monotonic request ids. Every async continuation asks
//     `isActive(id)`; a cancelled or superseded request can therefore never
//     start audio after the user cancelled or a newer answer arrived.
//   • evaluateWatchdog — decides, from a snapshot, whether the speaking state
//     may be cleared. It never returns 'finish' while a buffer is still
//     scheduled, so real audio is never cut.
//
// Both are deliberately tiny and pure so the failure modes are explicit.

export interface RequestGuard {
  /** Start a new request: invalidates every older one. */
  begin(): number
  /** Invalidate the current request without starting a new one. */
  cancel(): void
  /** True only for the newest, non-cancelled request. */
  isActive(id: number): boolean
  readonly current: number
}

export function createRequestGuard(): RequestGuard {
  let current = 0
  return {
    begin() { current += 1; return current },
    cancel() { current += 1 },
    isActive(id: number) { return id === current && id !== 0 },
    get current() { return current },
  }
}

/** Grace period after `speechSynthesis.speak()` before "not speaking" counts. */
export const SYNTH_GRACE_MS = 1_500
/** No audio and no stream completion after this long → the request is dead. */
export const STREAM_STALL_MS = 30_000

export interface WatchdogSnapshot {
  /** A browser speechSynthesis utterance is the active source. */
  synthesisActive: boolean
  synthSpeaking: boolean
  synthPending: boolean
  synthElapsedMs: number
  /** The HTTP stream finished (successfully or not). */
  streamSettled: boolean
  requestElapsedMs: number
  /** AudioBufferSourceNodes not yet ended. */
  liveSources: number
  contextState: 'running' | 'suspended' | 'closed' | 'interrupted' | null
}

export type WatchdogAction =
  | 'keep'            // audio may still be playing — do nothing
  | 'resume-and-keep' // context suspended — resume, keep waiting
  | 'finish'          // playback is over — clear isSpeaking
  | 'abort-stalled'   // the request never produced anything — abort + clear
/**
 * One watchdog tick.
 *
 * Ordering matters: while any source is alive we always return 'keep', which
 * is what prevents the watchdog from cutting legitimately playing audio.
 */
export function evaluateWatchdog(s: WatchdogSnapshot): WatchdogAction {
  if (s.synthesisActive) {
    if (!s.synthSpeaking && !s.synthPending && s.synthElapsedMs > SYNTH_GRACE_MS) {
      return 'finish'
    }
    return 'keep'
  }

  if (!s.streamSettled) {
    if (s.requestElapsedMs > STREAM_STALL_MS) return 'abort-stalled'
    return s.contextState === 'suspended' ? 'resume-and-keep' : 'keep'
  }

  if (s.liveSources > 0) return 'keep'
  return s.contextState === 'suspended' ? 'resume-and-keep' : 'finish'
}

/**
 * True when the environment exposes browser speech synthesis.
 * `undefined` (SSR), `{}` and `{ speechSynthesis: null }` all mean "no voice":
 * the caller must keep the answer on screen and carry on silently.
 */
export function hasBrowserSynthesis(win: unknown): boolean {
  if (typeof win !== 'object' || win === null) return false
  const value = (win as Record<string, unknown>).speechSynthesis
  return typeof value === 'object' && value !== null
}

