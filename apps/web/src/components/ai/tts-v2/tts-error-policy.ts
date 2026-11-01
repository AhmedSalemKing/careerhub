// TTS failure classification shared by the client hook and its tests.
//
// Rule of thumb:
//   • Recoverable provider problems (quota, timeout, 5xx, network) → the answer
//     is still useful, so browser speechSynthesis may speak it.
//   • Problems that describe the *request* or the *session* (401/403/400/422,
//     invalid JSON, validation, programming errors) → never fall back. Falling
//     back would hide an expired session or a bad payload behind a different
//     voice and make the bug impossible to diagnose.
//
// The server labels come from `parseGeminiError` / the route error boundary in
// /api/ai/tts-v2: quota_exceeded, auth_error, bad_request, timeout,
// network_error, provider_error, no_key, plus the route's own `unauthorized`.

export type TtsFailureKind =
  | 'quota_exceeded'
  | 'timeout'
  | 'provider_error'
  | 'no_key'
  | 'network_error'
  | 'bad_audio'
  | 'audio_context'
  | 'unauthorized'
  | 'auth_error'
  | 'bad_request'
  | 'invalid_json'
  | 'validation_error'
  | 'unknown'

export interface TtsFailureDecision {
  kind: TtsFailureKind
  /** true → browser speechSynthesis may read the answer instead. */
  allowBrowserFallback: boolean
  /** Short, non-technical Arabic message for the UI; null when silent. */
  userMessage: string | null
}

const SESSION_MESSAGE = 'انتهت جلستك أو مشكلة في الوصول لخدمة الصوت. جرّب إعادة تسجيل الدخول.'
const REQUEST_MESSAGE = 'تعذّر تشغيل الصوت لهذه الإجابة. يمكنك متابعة المحادثة نصياً.'

const FALLBACK_OK: ReadonlySet<TtsFailureKind> = new Set<TtsFailureKind>([
  'quota_exceeded',
  'timeout',
  'provider_error',
  'no_key',
  'network_error',
  'bad_audio',
  'audio_context',
  'unknown',
])

/** Server body labels that must never trigger a voice fallback. */
export const TTS_FATAL_RESPONSE_LABELS: ReadonlySet<string> = new Set([
  'unauthorized',
  'auth_error',
  'bad_request',
  'invalid_json',
  'validation_error',
  'no_text',
  'empty_text',
])

/** Server body labels that describe a recoverable provider problem. */
export const TTS_RECOVERABLE_RESPONSE_LABELS: ReadonlySet<string> = new Set([
  'quota_exceeded',
  'timeout',
  'provider_error',
  'network_error',
  'no_key',
])

const FATAL_LABELS = TTS_FATAL_RESPONSE_LABELS

export function isFatalTtsFailure(kind: TtsFailureKind): boolean {
  return !FALLBACK_OK.has(kind)
}

function decision(kind: TtsFailureKind): TtsFailureDecision {
  const allow = FALLBACK_OK.has(kind)
  let userMessage: string | null = null
  if (!allow) {
    userMessage =
      kind === 'unauthorized' || kind === 'auth_error' ? SESSION_MESSAGE : REQUEST_MESSAGE
  }
  return { kind, allowBrowserFallback: allow, userMessage }
}

/**
 * Classify a non-2xx response from /api/ai/tts-v2.
 *
 * @param status     HTTP status returned by our own route.
 * @param bodyError  `error` field of the JSON body (null when the body was not
 *                   JSON or did not carry one).
 */
export function classifyTtsHttpFailure(
  status: number,
  bodyError: string | null,
): TtsFailureDecision {
  const label = typeof bodyError === 'string' ? bodyError.trim() : ''

  // Session / request problems win over the transport status.
  if (FATAL_LABELS.has(label)) {
    if (label === 'unauthorized' || label === 'auth_error') return decision('auth_error')
    if (label === 'invalid_json') return decision('invalid_json')
    if (label === 'no_text' || label === 'empty_text') return decision('validation_error')
    return decision('bad_request')
  }

  if (label === 'quota_exceeded') return decision('quota_exceeded')
  if (label === 'timeout') return decision('timeout')
  if (label === 'no_key') return decision('no_key')
  if (label === 'provider_error' || label === 'network_error') return decision('provider_error')

  // No usable label: fall back to the status code.
  if (status === 401 || status === 403) return decision('auth_error')
  if (status === 400 || status === 422) return decision('validation_error')
  if (status === 429) return decision('quota_exceeded')
  if (status >= 500) return decision('provider_error')
  if (status >= 400) return decision('bad_request')
  return decision('unknown')
}

/** Classify a thrown fetch/stream error. Aborts are handled by the caller. */
export function classifyTtsFetchFailure(errorName?: string | null): TtsFailureDecision {
  if (errorName === 'AbortError') return { kind: 'network_error', allowBrowserFallback: false, userMessage: null }
  return decision('network_error')
}
