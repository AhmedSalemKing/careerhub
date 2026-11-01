// Tests for the real playback primitives used by useStreamingTTS:
//   • RequestGuard  — no audio from a cancelled/superseded request, no double audio;
//   • evaluateWatchdog — isSpeaking can never stay stuck, and real audio is never cut;
//   • hasBrowserSynthesis — missing browser voice must not break the conversation.

import {
  createRequestGuard,
  evaluateWatchdog,
  hasBrowserSynthesis,
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
