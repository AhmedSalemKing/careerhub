// Idempotency ledger for text-to-speech requests.
//
// A single assistant turn must be spoken at most once per voice. Without this
// guard, React effect re-runs, duplicated events or a second auto-listen cycle
// can fire the same TTS request several times (the symptom seen in production:
// duplicate `[TTS] speak` lines and duplicate audio).
//
// The ledger is keyed by `messageId | voice | textHash`, so:
//  - the same message never replays,
//  - changing the voice does NOT replay old messages (a new message is needed),
//  - a failed attempt can be released and retried explicitly by the user.
//
// Pure and framework-free so it can be unit-tested.

export interface SpeechLedgerOptions {
  /** Upper bound on remembered keys (LRU-ish eviction, oldest first). */
  maxEntries?: number
}

export interface SpeechLedger {
  /** True when this key has not been claimed yet. */
  shouldSpeak(key: string): boolean
  /** Claim a key. Returns false when it was already claimed. */
  claim(key: string): boolean
  /** Forget a key so an explicit retry is allowed. */
  release(key: string): void
  /** True if the key was claimed. */
  has(key: string): boolean
  /** Forget everything (new interview / restart). */
  reset(): void
  readonly size: number
}

export function createSpeechLedger(options: SpeechLedgerOptions = {}): SpeechLedger {
  const maxEntries = Math.max(1, options.maxEntries ?? 200)
  const seen = new Set<string>()

  const trim = () => {
    while (seen.size > maxEntries) {
      const oldest = seen.values().next().value
      if (oldest === undefined) break
      seen.delete(oldest)
    }
  }

  return {
    shouldSpeak(key) {
      return !seen.has(key)
    },
    claim(key) {
      if (seen.has(key)) return false
      seen.add(key)
      trim()
      return true
    },
    release(key) {
      seen.delete(key)
    },
    has(key) {
      return seen.has(key)
    },
    reset() {
      seen.clear()
    },
    get size() {
      return seen.size
    },
  }
}
