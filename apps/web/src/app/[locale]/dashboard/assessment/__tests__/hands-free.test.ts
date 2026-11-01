import { computeHandsFreePhase, handsFreeStatusLabel, shouldAutoListen, type HandsFreeInput } from '../hands-free'

const base: HandsFreeInput = {
  enabled: true,
  paused: false,
  audioUnlocked: true,
  isLoading: false,
  isSpeaking: false,
  isListening: false,
  micState: 'idle',
  pendingAssistantId: 'msg-1',
  assistantHandled: true,
}

describe('Hands-free state machine', () => {
  test('1 — disabled when the feature is off', () => {
    expect(computeHandsFreePhase({ ...base, enabled: false })).toBe('disabled')
    expect(shouldAutoListen({ ...base, enabled: false })).toBe(false)
  })

  test('2 — paused blocks auto-listen', () => {
    expect(computeHandsFreePhase({ ...base, paused: true })).toBe('paused')
    expect(shouldAutoListen({ ...base, paused: true })).toBe(false)
  })

  test('3 — audio not unlocked yet blocks auto-listen', () => {
    expect(computeHandsFreePhase({ ...base, audioUnlocked: false })).toBe('blocked')
    expect(shouldAutoListen({ ...base, audioUnlocked: false })).toBe(false)
  })

  test('4 — waiting for the assistant is "thinking"', () => {
    expect(computeHandsFreePhase({ ...base, isLoading: true })).toBe('thinking')
    expect(shouldAutoListen({ ...base, isLoading: true })).toBe(false)
  })

  test('5 — active playback is "speaking" and never starts the mic', () => {
    expect(computeHandsFreePhase({ ...base, isSpeaking: true })).toBe('speaking')
    expect(shouldAutoListen({ ...base, isSpeaking: true })).toBe(false)
  })

  test('6 — an active microphone is "listening" and is not restarted', () => {
    expect(computeHandsFreePhase({ ...base, isListening: true })).toBe('listening')
    expect(shouldAutoListen({ ...base, isListening: true })).toBe(false)
  })

  test('7 — processing state is "thinking"', () => {
    expect(computeHandsFreePhase({ ...base, micState: 'processing' })).toBe('thinking')
    expect(shouldAutoListen({ ...base, micState: 'processing' })).toBe(false)
  })

  test('8 — handled assistant message opens the microphone', () => {
    expect(computeHandsFreePhase(base)).toBe('waiting')
    expect(shouldAutoListen(base)).toBe(true)
  })

  test('9 — TTS failure still opens the microphone', () => {
    // This is the regression that used to kill hands-free interviews:
    // isSpeaking is false and there is no audio, but the turn is handled.
    const failed = { ...base, isSpeaking: false, assistantHandled: true }
    expect(shouldAutoListen(failed)).toBe(true)
  })

  test('10 — an unhandled assistant message keeps the microphone closed', () => {
    expect(shouldAutoListen({ ...base, assistantHandled: false })).toBe(false)
  })

  test('11 — no assistant message yet means no listen', () => {
    expect(shouldAutoListen({ ...base, pendingAssistantId: null })).toBe(false)
  })

  test('12 — a second call after the turn was consumed is blocked by the caller marking it unhandled', () => {
    expect(shouldAutoListen({ ...base, assistantHandled: false })).toBe(false)
  })

  test('13 — status labels cover every phase', () => {
    expect(handsFreeStatusLabel('listening')).toBe('يسمع الآن')
    expect(handsFreeStatusLabel('thinking')).toBe('يفكر')
    expect(handsFreeStatusLabel('speaking')).toBe('يتحدث')
    expect(handsFreeStatusLabel('waiting')).toBe('ينتظر')
    expect(handsFreeStatusLabel('paused')).toBe('موقف مؤقتاً')
    expect(handsFreeStatusLabel('blocked')).toBe('اضغط لتفعيل الصوت')
    expect(handsFreeStatusLabel('disabled')).toBe('جاهز')
  })
})
