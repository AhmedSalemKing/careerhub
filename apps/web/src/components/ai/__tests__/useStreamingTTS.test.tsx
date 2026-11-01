/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStreamingTTS } from '../tts-v2/useStreamingTTS'

const realFetch = global.fetch

// jsdom does not implement the speech synthesis constructors
class MockSpeechSynthesisUtterance {
  text = ''
  voice: SpeechSynthesisVoice | null = null
  lang = ''
  rate = 1
  pitch = 1
  onstart: ((ev: SpeechSynthesisEvent) => void) | null = null
  onend: ((ev: SpeechSynthesisEvent) => void) | null = null
  onerror: ((ev: SpeechSynthesisEvent) => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
})

type MockVoice = Partial<SpeechSynthesisVoice> & { lang: string; name: string }

function makeMockVoice(lang: string, name: string): MockVoice {
  return { lang, name, voiceURI: name, default: false, localService: true }
}

function setupSpeechSynthesis(voices: MockVoice[] = []) {
  const utterances: SpeechSynthesisUtterance[] = []
  const handlers: Record<string, (() => void)[]> = {}

  const synth = {
    getVoices: jest.fn().mockReturnValue(voices),
    cancel: jest.fn(),
    speak: jest.fn((u: SpeechSynthesisUtterance) => {
      utterances.push(u)
      // Fire onstart synchronously
      u.onstart?.(undefined as unknown as SpeechSynthesisEvent)
      // Fire onend asynchronously so tests can observe isSpeaking
      setTimeout(() => u.onend?.(undefined as unknown as SpeechSynthesisEvent), 10)
    }),
    addEventListener: jest.fn((event: string, fn: () => void) => {
      handlers[event] = handlers[event] || []
      handlers[event].push(fn)
    }),
    removeEventListener: jest.fn((event: string, fn: () => void) => {
      handlers[event] = (handlers[event] || []).filter(f => f !== fn)
    }),
  } as unknown as SpeechSynthesis

  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: synth,
  })

  return { synth, utterances, handlers }
}

function mockAudioContext() {
  const sources: { stop: jest.Mock; start: jest.Mock; onended?: () => void }[] = []
  const ctx = {
    state: 'running',
    sampleRate: 24000,
    currentTime: 0,
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    createBuffer: jest.fn((_ch: number, samples: number, _rate: number) => ({
      duration: samples / 24000,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(samples)),
    })),
    createBufferSource: jest.fn(() => {
      const source = { stop: jest.fn(), start: jest.fn(), connect: jest.fn() }
      sources.push(source)
      return source
    }),
    destination: {},
  } as unknown as AudioContext

  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: jest.fn().mockImplementation(() => ctx),
  })
  Object.defineProperty(window, 'webkitAudioContext', {
    writable: true,
    value: jest.fn().mockImplementation(() => ctx),
  })

  return { ctx, sources }
}

function pcmStreamResponse(body: Uint8Array, headers: HeadersInit = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Map(Object.entries({
      'content-type': 'audio/l16; rate=24000; channels=1',
      ...headers,
    })),
    body: {
      getReader: () => {
        let done = false
        return {
          read: async () => {
            if (done) return { done: true, value: undefined }
            done = true
            return { done: false, value: body }
          },
          cancel: jest.fn(),
        }
      },
    },
  } as unknown as Response
}

describe('useStreamingTTS — lifecycle', () => {
  beforeEach(() => {
    jest.useRealTimers()
    mockAudioContext()
  })

  afterEach(() => {
    global.fetch = realFetch
    jest.restoreAllMocks()
  })

  test('starts speaking when Gemini stream succeeds', async () => {
    const pcm = new Uint8Array(1920)
    global.fetch = jest.fn().mockResolvedValue(pcmStreamResponse(pcm)) as unknown as typeof fetch
    const { result } = renderHook(() => useStreamingTTS())

    act(() => result.current.speak('مرحبا'))

    await waitFor(() => expect(result.current.isSpeaking).toBe(true))
    expect(result.current.lastError).toBeNull()
  })

  test('falls back to browser TTS on quota_exceeded', async () => {
    const { synth } = setupSpeechSynthesis([makeMockVoice('ar-EG', 'Egyptian')])
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'quota_exceeded' }),
    } as Response) as unknown as typeof fetch

    const { result } = renderHook(() => useStreamingTTS())
    act(() => result.current.speak('مرحبا'))

    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1))
    // lastError reports the HTTP failure kind; browser fallback is automatic
    expect(result.current.lastError).toBe('quota_exceeded')
  })

  test('does NOT fall back on auth error', async () => {
    const { synth } = setupSpeechSynthesis([makeMockVoice('ar-EG', 'Egyptian')])
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'auth_error' }),
    } as Response) as unknown as typeof fetch

    const { result } = renderHook(() => useStreamingTTS())
    act(() => result.current.speak('مرحبا'))

    await waitFor(() => expect(result.current.lastError).toBe('auth_error'))
    expect(synth.speak).not.toHaveBeenCalled()
    expect(result.current.isSpeaking).toBe(false)
  })

  test('cancels previous utterance when a new speak is requested', async () => {
    const { synth } = setupSpeechSynthesis([makeMockVoice('ar-EG', 'Egyptian')])
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'quota_exceeded' }),
    } as Response) as unknown as typeof fetch

    const { result } = renderHook(() => useStreamingTTS())
    act(() => result.current.speak('أول'))
    act(() => result.current.speak('ثاني'))

    // The first speak is cancelled before reaching fallback; only the second fires
    await waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1))
    expect(synth.cancel).toHaveBeenCalled()
  })

  test('stopSpeaking clears isSpeaking and cancels audio', async () => {
    const pcm = new Uint8Array(1920)
    global.fetch = jest.fn().mockResolvedValue(pcmStreamResponse(pcm)) as unknown as typeof fetch
    const { result } = renderHook(() => useStreamingTTS())

    act(() => result.current.speak('مرحبا'))
    await waitFor(() => expect(result.current.isSpeaking).toBe(true))

    act(() => result.current.stopSpeaking())
    expect(result.current.isSpeaking).toBe(false)
  })

  test('reports quota_exceeded when browser TTS is also unavailable', async () => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: undefined,
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'quota_exceeded' }),
    } as Response) as unknown as typeof fetch

    const { result } = renderHook(() => useStreamingTTS())
    act(() => result.current.speak('مرحبا'))

    // Even without browser synthesis, the error kind from the HTTP layer is reported
    await waitFor(() => expect(result.current.lastError).toBe('quota_exceeded'))
    expect(result.current.isSpeaking).toBe(false)
  })
})
