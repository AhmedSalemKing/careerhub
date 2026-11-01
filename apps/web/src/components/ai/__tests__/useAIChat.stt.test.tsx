/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIChat } from '../useAIChat'

// ---------- Mock SpeechRecognition -------------------------------------------
//
// stt-controller reads events as:
//   event.results[event.resultIndex].isFinal          (SpeechRecognitionResult.isFinal)
//   event.results[event.resultIndex][0].transcript    (first alternative's transcript)
//
// Each SpeechRecognitionResult is an array-like with an .isFinal property:
//   Object.assign([{ transcript }], { isFinal, length: 1 })

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = []

  lang = ''
  continuous = false
  interimResults = false
  onstart: (() => void) | null = null
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: unknown } }) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((e: { error?: string }) => void) | null = null

  private _running = false

  constructor() {
    MockSpeechRecognition.instances.push(this)
  }

  start() {
    this._running = true
    setTimeout(() => this.onstart?.(), 0)
  }

  stop() {
    if (!this._running) return
    this._running = false
    setTimeout(() => this.onend?.(), 0)
  }

  abort() {
    this._running = false
    setTimeout(() => this.onend?.(), 0)
  }

  /** Emit a single SpeechRecognitionResult at the given resultIndex. */
  emitResult(resultIndex: number, transcript: string, isFinal: boolean) {
    // SpeechRecognitionResult: array-like with .isFinal and [0] = { transcript }
    const speechResult = Object.assign(
      [{ transcript, confidence: 0.9 }],
      { isFinal, length: 1 },
    )
    // results: { length, [i]: SpeechRecognitionResult }
    const results = Object.assign(
      { length: resultIndex + 1, [resultIndex]: speechResult },
      {},
    )
    this.onresult?.({ resultIndex, results })
  }

  emitEnd() {
    this._running = false
    this.onend?.()
  }

  emitError(error: string) {
    this._running = false
    this.onerror?.({ error })
  }
}

function setupSpeechRecognition() {
  Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: MockSpeechRecognition,
  })
  MockSpeechRecognition.instances = []
}

function mockAudioContextAndFetch() {
  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      state: 'running',
      sampleRate: 24000,
      currentTime: 0,
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      createBuffer: jest.fn(() => ({ duration: 0, getChannelData: () => new Float32Array(0) })),
      createBufferSource: jest.fn(() => ({ start: jest.fn(), stop: jest.fn(), connect: jest.fn() })),
      destination: {},
    })),
  })
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      getVoices: jest.fn().mockReturnValue([]),
      cancel: jest.fn(),
      speak: jest.fn(),
    },
  })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ content: 'رد مساعد' }),
  } as Response) as unknown as typeof fetch
}

// ---------- Tests -----------------------------------------------------------

describe('useAIChat — STT lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true })
    setupSpeechRecognition()
    mockAudioContextAndFetch()
  })

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers())
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('accumulates final results across unexpected Chrome onend restarts', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()

    act(() => result.current.startListening(onResult))
    act(() => jest.advanceTimersByTime(50))

    const rec1 = MockSpeechRecognition.instances[0]
    expect(rec1.continuous).toBe(true)
    expect(rec1.interimResults).toBe(true)

    // First chunk of speech — Chrome kills the session right after
    act(() => rec1.emitResult(0, 'أنا أحب البرمجة', true))
    act(() => rec1.emitEnd())
    // useAIChat uses DEFAULT_RESTART_DELAY_MS (300ms) — advance past it
    act(() => jest.advanceTimersByTime(400))

    // A new session should have started automatically
    expect(MockSpeechRecognition.instances.length).toBeGreaterThanOrEqual(2)
    const rec2 = MockSpeechRecognition.instances[MockSpeechRecognition.instances.length - 1]

    // Second chunk continues the sentence
    act(() => rec2.emitResult(0, 'البرمجة جزء مهم من حياتي', true))

    // User presses stop
    act(() => result.current.stopListening())
    act(() => jest.advanceTimersByTime(100))

    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult).toHaveBeenCalledWith('أنا أحب البرمجة جزء مهم من حياتي')
  })

  test('does not submit during natural pauses and keeps listening', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()

    act(() => result.current.startListening(onResult))
    act(() => jest.advanceTimersByTime(50))

    const rec1 = MockSpeechRecognition.instances[0]
    act(() => rec1.emitResult(0, 'أحب', true))  // too short to auto-commit
    act(() => rec1.emitEnd())

    // Wait through the restart window — still below MIN_COMMIT_CHARS
    act(() => jest.advanceTimersByTime(300))

    expect(onResult).not.toHaveBeenCalled()
    expect(result.current.isListening || result.current.micState === 'listening').toBe(true)
  })

  test('captures interim text when user stops mid-sentence', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()

    act(() => result.current.startListening(onResult))
    act(() => jest.advanceTimersByTime(50))

    const rec = MockSpeechRecognition.instances[0]
    // Chrome sends running accumulation for interims at the same resultIndex
    act(() => rec.emitResult(0, 'أنا أحب', false))
    act(() => rec.emitResult(0, 'أنا أحب البرمجة', false))

    act(() => result.current.stopListening())
    act(() => jest.advanceTimersByTime(100))

    expect(onResult).toHaveBeenCalledWith('أنا أحب البرمجة')
  })

  test('ignores stale callbacks after stop', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()

    act(() => result.current.startListening(onResult))
    act(() => jest.advanceTimersByTime(50))

    const rec1 = MockSpeechRecognition.instances[0]
    act(() => result.current.stopListening())
    act(() => jest.advanceTimersByTime(100))

    // A late result from the torn-down session should not submit again
    act(() => rec1.emitResult(0, 'نص متأخر', true))
    act(() => jest.advanceTimersByTime(100))

    // onResult may have been called once (empty commit on manual stop),
    // but the stale result must not add a second call.
    expect(onResult.mock.calls.length).toBeLessThanOrEqual(1)
  })

  test('stops and reports not-allowed without restart loop', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()
    const onError = jest.fn()

    act(() => result.current.startListening(onResult, onError))
    act(() => jest.advanceTimersByTime(50))

    const rec = MockSpeechRecognition.instances[0]
    act(() => rec.emitError('not-allowed'))
    act(() => jest.advanceTimersByTime(500))

    expect(onError).toHaveBeenCalledWith('not-allowed')
    expect(onResult).not.toHaveBeenCalled()
    expect(result.current.micState).toBe('idle')
  })

  test('submits only once even if stop is called twice', async () => {
    const { result } = renderHook(() => useAIChat())
    const onResult = jest.fn()

    act(() => result.current.startListening(onResult))
    act(() => jest.advanceTimersByTime(50))

    const rec = MockSpeechRecognition.instances[0]
    act(() => rec.emitResult(0, 'أحب البرمجة', true))

    act(() => result.current.stopListening())
    act(() => result.current.stopListening())
    act(() => jest.advanceTimersByTime(100))

    expect(onResult).toHaveBeenCalledTimes(1)
  })
})
