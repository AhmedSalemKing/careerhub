// Tests for the real playback primitives used by useStreamingTTS:
//   • RequestGuard  — no audio from a cancelled/superseded request, no double audio;
//   • evaluateWatchdog — isSpeaking can never stay stuck, and real audio is never cut;
//   • hasBrowserSynthesis — missing browser voice must not break the conversation.
//   • shouldClearOnWorkersDone — pipeline completion must not clear isSpeaking when
//     browser TTS fallback is active (regression guard for the seg-0 fallback bug).

import {
  createRequestGuard,
  evaluateWatchdog,
  hasBrowserSynthesis,
  shouldClearOnWorkersDone,
  SYNTH_GRACE_MS,
  STREAM_STALL_MS,
} from '../tts-playback'
import type { WatchdogSnapshot } from '../tts-playback'

const base: WatchdogSnapshot = {
  synthesisActive: false,
  synthSpeaking: false,
  synthPending: false,
  synthElapsedMs: 0,
  streamSettled: true,
  requestElapsedMs: 0,
  liveSources: 0,
  contextState: 'running',
}

describe('TTS playback - request guard', () => {
  test('only the newest request is active', () => {
    const guard = createRequestGuard()
    const first = guard.begin()
    expect(guard.isActive(first)).toBe(true)

    const second = guard.begin()
    expect(guard.isActive(first)).toBe(false)
    expect(guard.isActive(second)).toBe(true)
    // A newer request cancels the older one: the older one must not start audio.
    expect(guard.isActive(first)).toBe(false)
  })

  test('a late response after cancel is rejected', () => {
    const guard = createRequestGuard()
    const id = guard.begin()
    guard.cancel()
    expect(guard.isActive(id)).toBe(false)
  })

  test('a response after stop cannot become active again', () => {
    const guard = createRequestGuard()
    const id = guard.begin()
    guard.cancel()
    // The caller is still holding `id` — this is the late-response case.
    expect(guard.isActive(id)).toBe(false)
    const next = guard.begin()
    expect(guard.isActive(id)).toBe(false)
    expect(guard.isActive(next)).toBe(true)
  })

  test('id 0 is never active (initial state before any request)', () => {
    const guard = createRequestGuard()
    expect(guard.isActive(0)).toBe(false)
  })
})

describe('TTS playback - speaking watchdog', () => {
  test('keeps waiting while a scheduled buffer is still playing', () => {
    expect(evaluateWatchdog({ ...base, liveSources: 2 })).toBe('keep')
    // Even far past any timeout: real audio must never be cut.
    expect(evaluateWatchdog({
      ...base, liveSources: 1, requestElapsedMs: 120_000,
    })).toBe('keep')
  })

  test('finishes when the stream is done and no source is alive', () => {
    expect(evaluateWatchdog({ ...base, streamSettled: true, liveSources: 0 })).toBe('finish')
  })

  test('stalled stream is aborted so isSpeaking cannot hang forever', () => {
    const stalled = {
      ...base,
      streamSettled: false,
      requestElapsedMs: STREAM_STALL_MS + 1,
      liveSources: 0,
    }
    expect(evaluateWatchdog(stalled)).toBe('abort-stalled')
  })

  test('a slow-but-alive stream is not aborted before the stall window', () => {
    expect(evaluateWatchdog({
      ...base,
      streamSettled: false,
      requestElapsedMs: STREAM_STALL_MS - 1,
    })).toBe('keep')
  })

  test('suspended AudioContext is resumed without declaring the answer finished', () => {
    expect(evaluateWatchdog({
      ...base,
      streamSettled: false,
      contextState: 'suspended',
    })).toBe('resume-and-keep')
    expect(evaluateWatchdog({
      ...base,
      streamSettled: true,
      liveSources: 0,
      contextState: 'suspended',
    })).toBe('resume-and-keep')
  })

  test('browser synthesis: grace period then finish (never stuck)', () => {
    const started = {
      ...base,
      synthesisActive: true,
      synthSpeaking: true,
      synthPending: false,
      synthElapsedMs: SYNTH_GRACE_MS + 1,
    }
    expect(evaluateWatchdog(started)).toBe('keep')

    const silentButPastGrace = {
      ...started,
      synthSpeaking: false,
      synthElapsedMs: SYNTH_GRACE_MS + 1_000,
    }
    expect(evaluateWatchdog(silentButPastGrace)).toBe('finish')

    const stillPending = { ...started, synthSpeaking: false, synthPending: true }
    expect(evaluateWatchdog(stillPending)).toBe('keep')
  })

  test('browser synthesis right after speak() is not cut inside the grace window', () => {
    expect(evaluateWatchdog({
      ...base,
      synthesisActive: true,
      synthSpeaking: false,
      synthPending: false,
      synthElapsedMs: SYNTH_GRACE_MS - 1,
    })).toBe('keep')
  })
})

describe('TTS playback - browser voice availability', () => {
  test('reports whether speechSynthesis exists', () => {
    expect(hasBrowserSynthesis(undefined)).toBe(false)
    expect(hasBrowserSynthesis(null)).toBe(false)
    expect(hasBrowserSynthesis({})).toBe(false)
    expect(hasBrowserSynthesis({ speechSynthesis: null })).toBe(false)
    expect(hasBrowserSynthesis({ speechSynthesis: { speak() {} } })).toBe(true)
  })
})

// shouldClearOnWorkersDone — guards the Promise.all.then settlement check in
// useSentencePipeline.  The function must return false in every situation where
// clearing isSpeaking would cut off audio that is still playing.
//
// Scenario map (what the pipeline state looks like when both workers exit):
//
//  A. Seg-0 HTTP 429 / 5xx → trySynthesisFallback() started → synthRef set,
//     isSpeaking=true, sourcesRef=[], streamSettled not yet set, workers done.
//     MUST return false so the browser utterance can finish before mic re-arms.
//
//  B. All segments succeeded and their AudioBufferSourceNodes have already ended
//     (onended fired before Promise.all resolved).
//     MUST return true — nothing is playing, safe to clear.
//
//  C. Seg-1 fetch failed (seg-0 already scheduled and playing), workers done,
//     sourcesRef.current.length === 1.
//     MUST return false — seg-0 audio is still playing.
//
//  D. Seg-1 failed, seg-0 finished (onended already fired), workers done,
//     sourcesRef.current.length === 0, synthRef === null.
//     MUST return true — nothing is playing, safe to clear.
//     (In practice source.onended clears isSpeaking first, but a race where
//     Promise.all fires before the last onended must also be handled safely.)
//
//  E. Defensive: liveSources > 0 AND synthActive (impossible in normal flow
//     because fallback only fires on seg-0 failure which sets stopAfterIdx=0,
//     meaning seg-1 can never schedule).  MUST return false.
describe('shouldClearOnWorkersDone', () => {
  // Scenario A — main regression: seg-0 recoverable failure, browser TTS active
  test('seg-0 recoverable failure: synthActive=true, sources=0 → do NOT clear (regression)', () => {
    // Before fix: missing synthActive check caused setIsSpeaking(false) here,
    // allowing hands-free auto-listen to fire while browser TTS was speaking.
    expect(shouldClearOnWorkersDone({ liveSources: 0, synthActive: true })).toBe(false)
  })

  // Scenario B — normal completion path
  test('all audio finished, no synth → clear isSpeaking', () => {
    expect(shouldClearOnWorkersDone({ liveSources: 0, synthActive: false })).toBe(true)
  })

  // Scenario C — seg-1 failure, seg-0 still playing
  test('seg-1 failed but seg-0 audio still playing (liveSources=1) → do NOT clear', () => {
    // Workers are done (pipeline stopped at seg-1) but seg-0 source has not
    // fired onended yet.  Clearing here would interrupt audible audio.
    expect(shouldClearOnWorkersDone({ liveSources: 1, synthActive: false })).toBe(false)
  })

  // Scenario D — seg-1 failure, seg-0 already finished
  test('seg-1 failed, seg-0 audio ended, no synth → clear isSpeaking', () => {
    // This is the same as scenario B from the function's perspective.
    // isSpeaking is normally cleared by source.onended first, but if Promise.all
    // wins the race the function must also return true.
    expect(shouldClearOnWorkersDone({ liveSources: 0, synthActive: false })).toBe(true)
  })

  // Scenario E — defensive: both active
  test('defensive: both sources and synth active → do NOT clear', () => {
    expect(shouldClearOnWorkersDone({ liveSources: 1, synthActive: true })).toBe(false)
  })

  // Cancellation interaction: after stopSpeaking(), isActive() returns false so
  // Promise.all.then returns early before shouldClearOnWorkersDone is reached.
  // The guard below verifies the RequestGuard works as the outer gate.
  test('cancelled request: isActive(id) false → settlement guard is never reached', () => {
    const guard = createRequestGuard()
    const id = guard.begin()
    guard.cancel()
    // Simulates the `if (!isActive()) return` at the top of Promise.all.then.
    const wouldCallClear = guard.isActive(id)
    expect(wouldCallClear).toBe(false)
    // shouldClearOnWorkersDone is never called — no assertion needed on it.
  })
})
