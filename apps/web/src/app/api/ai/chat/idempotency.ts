// Request-level idempotency for duplicate chat submissions.
//
// The client retries a failed network call once with the SAME requestId. Without
// server cooperation that retry would append a second user turn and produce a
// second assistant answer. This store collapses concurrent and repeated calls
// with the same key into one execution and replays its result.
//
// Scope: PER SERVERLESS INSTANCE. On Vercel, a retry that lands on a different
// cold instance is not deduplicated here — the client-side isLoading guard and
// the single bounded retry keep that window small. This is a mitigation, not a
// distributed lock, and is documented as such.

interface Entry {
  promise: Promise<unknown>
  expiresAt: number
}

export interface IdempotencyStoreOptions {
  ttlMs?: number
  maxEntries?: number
  now?: () => number
}

export interface IdempotencyStore {
  run<T>(key: string, fn: () => Promise<T>): Promise<T>
  readonly size: number
  clear(): void
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value)
}

export function createIdempotencyStore(options: IdempotencyStoreOptions = {}): IdempotencyStore {
  const ttlMs = options.ttlMs ?? 90_000
  const maxEntries = Math.max(1, options.maxEntries ?? 500)
  const now = options.now ?? (() => Date.now())
  const entries = new Map<string, Entry>()

  const evict = () => {
    const t = now()
    entries.forEach((entry, key) => {
      if (entry.expiresAt <= t) entries.delete(key)
    })
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value
      if (oldest === undefined) break
      entries.delete(oldest)
    }
  }

  return {
    run<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const existing = entries.get(key)
      if (existing && existing.expiresAt > now()) {
        return existing.promise as Promise<T>
      }

      const promise = fn().catch((err) => {
        // A failed execution must not poison the key.
        entries.delete(key)
        throw err
      })

      entries.set(key, { promise, expiresAt: now() + ttlMs })
      // Bound the store after insertion so `size` never exceeds `maxEntries`.
      evict()
      return promise
    },

    get size() {
      return entries.size
    },

    clear() {
      entries.clear()
    },
  }
}
