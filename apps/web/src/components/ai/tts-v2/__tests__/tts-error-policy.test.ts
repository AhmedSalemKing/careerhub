// Tests for the real client-side TTS failure policy used by useStreamingTTS.
//
// The requirement is asymmetric on purpose:
//   • quota / timeout / provider / network → browser voice may read the answer;
//   • 401 / 403 / 400 / invalid JSON / validation → NEVER fall back, because a
//     browser voice would hide an expired session or a broken payload.
// These tests also assert the server labels and the client classification agree.

import {
  classifyTtsHttpFailure,
  classifyTtsFetchFailure,
  isFatalTtsFailure,
  TTS_FATAL_RESPONSE_LABELS,
  TTS_RECOVERABLE_RESPONSE_LABELS,
} from '../tts-error-policy'
import type { TtsFailureKind } from '../tts-error-policy'

describe('TTS failure policy - session/request errors never fall back', () => {
  test.each([
    [401, null, 'auth_error'],
    [403, null, 'auth_error'],
    [400, null, 'validation_error'],
  ])('HTTP %s (body=%s) → %s, no browser fallback', (status, body, kind) => {
    const failure = classifyTtsHttpFailure(status as number, body as string | null)
    expect(failure.kind).toBe(kind)
    expect(failure.allowBrowserFallback).toBe(false)
    expect(failure.userMessage).not.toBeNull()
  })

  test('401 from our own route (unauthorized) does not fall back', () => {
    const failure = classifyTtsHttpFailure(401, 'unauthorized')
    expect(failure.kind).toBe('auth_error')
    expect(failure.allowBrowserFallback).toBe(false)
    expect(failure.userMessage).toContain('جلستك')
  })

  test('invalid JSON never falls back, whatever the status', () => {
    const failure = classifyTtsHttpFailure(502, 'invalid_json')
    expect(failure.kind).toBe('invalid_json')
    expect(failure.allowBrowserFallback).toBe(false)
  })

  test('validation labels (no_text / empty_text) never fall back', () => {
    for (const label of ['no_text', 'empty_text', 'validation_error']) {
      const failure = classifyTtsHttpFailure(400, label)
      expect(failure.allowBrowserFallback).toBe(false)
      expect(failure.userMessage).not.toBeNull()
    }
  })

  test('a fatal body label wins over a 5xx transport status', () => {
    const failure = classifyTtsHttpFailure(500, 'bad_request')
    expect(failure.kind).toBe('bad_request')
    expect(failure.allowBrowserFallback).toBe(false)
  })
})

describe('TTS failure policy - recoverable provider errors may fall back', () => {
  test.each([
    [429, 'quota_exceeded', 'quota_exceeded'],
    [503, 'no_key', 'no_key'],
    [503, 'timeout', 'timeout'],
    [503, 'provider_error', 'provider_error'],
    [503, 'network_error', 'provider_error'],
    [429, null, 'quota_exceeded'],
    [502, null, 'provider_error'],
  ])('HTTP %s (body=%s) → %s, fallback allowed', (status, body, kind) => {
    const failure = classifyTtsHttpFailure(status as number, body as string | null)
    expect(failure.kind).toBe(kind)
    expect(failure.allowBrowserFallback).toBe(true)
    expect(failure.userMessage).toBeNull()
  })

  test('both models exhausting quota stays a quota failure (429)', () => {
    const failure = classifyTtsHttpFailure(429, 'quota_exceeded')
    expect(failure.kind).toBe('quota_exceeded')
    expect(failure.allowBrowserFallback).toBe(true)
  })
})

describe('TTS failure policy - server and client agree', () => {
  test('every fatal route label is classified as fatal on the client', () => {
    for (const label of Array.from(TTS_FATAL_RESPONSE_LABELS)) {
      const failure = classifyTtsHttpFailure(400, label)
      expect(failure.allowBrowserFallback).toBe(false)
      expect(isFatalTtsFailure(failure.kind)).toBe(true)
    }
  })

  test('every recoverable route label allows the browser fallback', () => {
    for (const label of Array.from(TTS_RECOVERABLE_RESPONSE_LABELS)) {
      const failure = classifyTtsHttpFailure(503, label)
      expect(failure.allowBrowserFallback).toBe(true)
      expect(isFatalTtsFailure(failure.kind)).toBe(false)
    }
  })

  test('isFatalTtsFailure is exactly the negation of allowBrowserFallback', () => {
    const cases: Array<[TtsFailureKind, boolean]> = [
      ['quota_exceeded', false], ['timeout', false], ['provider_error', false],
      ['no_key', false], ['network_error', false], ['bad_audio', false],
      ['audio_context', false], ['unknown', false],
      ['unauthorized', true], ['auth_error', true], ['bad_request', true],
      ['invalid_json', true], ['validation_error', true],
    ]
    for (const [kind, fatal] of cases) {
      expect(isFatalTtsFailure(kind)).toBe(fatal)
    }
  })

  test('a cancelled request (AbortError) never starts the browser voice', () => {
    const failure = classifyTtsFetchFailure('AbortError')
    expect(failure.kind).toBe('network_error')
    expect(failure.allowBrowserFallback).toBe(false)
    expect(failure.userMessage).toBeNull()
  })

  test('a genuine network failure may fall back', () => {
    const failure = classifyTtsFetchFailure('TypeError')
    expect(failure.allowBrowserFallback).toBe(true)
  })
})
