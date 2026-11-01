// Hands-free conversation state machine.
//
// The previous implementation inferred "TTS finished" from `isSpeaking`, which
// is false both before playback starts and after it fails. When the voice
// service failed, the interview never re-opened the microphone, so a hands-free
// session silently died. It also had no explicit notion of "this assistant
// message has already been handled", which allowed duplicate listens.
//
// This pure module derives one phase from explicit inputs. The React page only
// reacts to `shouldAutoListen()` — it never re-implements the rules inline.

export type HandsFreePhase =
  | 'disabled'   // feature off
  | 'paused'     // user paused
  | 'blocked'    // audio not unlocked yet
  | 'thinking'   // waiting for the assistant reply
  | 'speaking'   // TTS is playing
  | 'listening'  // microphone is active
  | 'waiting'    // idle, ready to listen again

export interface HandsFreeInput {
  enabled: boolean
  paused: boolean
  audioUnlocked: boolean
  isLoading: boolean
  isSpeaking: boolean
  isListening: boolean
  micState: 'idle' | 'listening' | 'processing'
  /** Latest assistant message id, or null when there is none. */
  pendingAssistantId: string | null
  /**
   * True once the latest assistant message has been spoken OR its TTS attempt
   * has concluded (including failure). Failure must still open the mic.
   */
  assistantHandled: boolean
}

export function computeHandsFreePhase(input: HandsFreeInput): HandsFreePhase {
  if (!input.enabled) return 'disabled'
  if (input.paused) return 'paused'
  if (!input.audioUnlocked) return 'blocked'
  if (input.isLoading || input.micState === 'processing') return 'thinking'
  if (input.isSpeaking) return 'speaking'
  if (input.isListening || input.micState === 'listening') return 'listening'
  return 'waiting'
}

export function shouldAutoListen(input: HandsFreeInput): boolean {
  if (computeHandsFreePhase(input) !== 'waiting') return false
  if (input.pendingAssistantId === null) return false
  return input.assistantHandled
}

/** Human label for the orb status line (Arabic UI). */
export function handsFreeStatusLabel(
  phase: HandsFreePhase,
  opts: { isThinking: boolean; isSpeaking: boolean } = { isThinking: false, isSpeaking: false },
): string {
  switch (phase) {
    case 'disabled':
      return 'جاهز'
    case 'paused':
      return 'موقف مؤقتاً'
    case 'blocked':
      return 'اضغط لتفعيل الصوت'
    case 'thinking':
      return 'يفكر'
    case 'speaking':
      return 'يتحدث'
    case 'listening':
      return 'يسمع الآن'
    case 'waiting':
      if (opts.isThinking) return 'يفكر'
      if (opts.isSpeaking) return 'يتحدث'
      return 'ينتظر'
  }
}
