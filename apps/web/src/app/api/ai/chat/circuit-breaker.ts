// Circuit breaker for Gemini model failover.
//
// NOTE: Next.js on Vercel runs each serverless invocation in an isolated process.
// This breaker is PER-INSTANCE ONLY — warm instances handling sequential requests
// from the same user session get protection; separate cold-start instances do not
// share state. This is NOT a globally-shared circuit breaker.
//
// Half-open probe: after halfOpenAt elapses, exactly one request is allowed through.
// The probe slot (probing flag) is claimed synchronously in the Node.js event loop,
// preventing two concurrent in-process requests from both becoming probes.
// The slot is released unconditionally in recordFailure and recordSuccess,
// including for non-qualifying (auth) failures, so it can never get stuck.

export interface CbState {
  consecutiveFailures: number
  openUntil:           number   // epoch ms; 0 = closed
  halfOpenAt:          number   // probe allowed after this epoch ms
  probing:             boolean  // probe slot occupied
}

export interface CbStore {
  isOpen(model: string): boolean
  recordSuccess(model: string): void
  recordFailure(model: string, qualifying: boolean): void
  getState(model: string): CbState
}

export interface CbOptions {
  failureThreshold?: number
  openMs?:           number
  halfOpenAfterMs?:  number
}

export function makeCbStore(opts: CbOptions = {}): CbStore {
  const threshold     = opts.failureThreshold ?? 3
  const openMs        = opts.openMs           ?? 30_000
  const halfOpenAfter = opts.halfOpenAfterMs  ?? 20_000

  const state: Record<string, CbState> = {}

  function getCb(model: string): CbState {
    if (!state[model]) {
      state[model] = { consecutiveFailures: 0, openUntil: 0, halfOpenAt: 0, probing: false }
    }
    return state[model]
  }

  function isOpen(model: string): boolean {
    const cb  = getCb(model)
    const now = Date.now()
    if (cb.openUntil === 0) return false
    if (now >= cb.halfOpenAt && !cb.probing) {
      cb.probing = true   // claim probe slot — synchronous, no race in single-threaded JS
      return false
    }
    return true
  }

  function recordSuccess(model: string): void {
    const cb = getCb(model)
    cb.consecutiveFailures = 0
    cb.openUntil           = 0
    cb.halfOpenAt          = 0
    cb.probing             = false
  }

  function recordFailure(model: string, qualifying: boolean): void {
    const cb   = getCb(model)
    cb.probing = false   // always release probe slot, qualifying or not
    if (!qualifying) return
    cb.consecutiveFailures++
    if (cb.consecutiveFailures >= threshold) {
      const now     = Date.now()
      cb.openUntil  = now + openMs
      cb.halfOpenAt = now + halfOpenAfter
    }
  }

  function getState(model: string): CbState {
    return { ...getCb(model) }
  }

  return { isOpen, recordSuccess, recordFailure, getState }
}

// Singleton used in the production POST handler.
export const productionCb: CbStore = makeCbStore()
