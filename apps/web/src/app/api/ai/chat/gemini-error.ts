// Safe, dependency-free parsing/classification of Gemini/provider error bodies.
//
// The provider returns HTTP 429 for two very different situations:
//   1. a rate/quota limit scoped to ONE model      → the fallback model may help
//   2. a project/account-wide quota exhaustion     → the fallback will also fail
//
// This module deliberately returns only a coarse classification plus a short
// non-sensitive reason code. Raw provider bodies, quota identifiers, project
// numbers and API keys never leave this module, so nothing can be forwarded to
// a client by accident.
//
// Next.js route files may only export HTTP handlers/config, so this logic lives
// in its own module instead of being exported from route.ts.

export type RateLimitScope = 'model' | 'project' | 'unknown'

export interface RateLimitInfo {
  scope: RateLimitScope
  /** Provider-suggested retry delay in ms, when present. */
  retryAfterMs: number | null
  /** Short, non-sensitive reason for server logs only. */
  reason: string
}

interface JsonObject {
  [key: string]: unknown
}

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/** Google uses protobuf duration strings such as "23s" or "1.5s". */
function parseRetryDelay(value: unknown): number | null {
  const raw = stringValue(value)
  if (!raw) return null
  const match = raw.match(/^(\d+(?:\.\d+)?)s$/)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null
}

interface QuotaSummary {
  text: string
  hasModelDimension: boolean
}

function collectQuotaDetails(details: unknown[]): QuotaSummary {
  let text = ''
  let hasModelDimension = false

  for (const entry of details) {
    const detail = asObject(entry)
    if (!detail) continue

    const type = stringValue(detail['@type']) ?? ''
    if (!type.includes('QuotaFailure')) continue

    const violations = Array.isArray(detail.violations) ? detail.violations : []
    for (const rawViolation of violations) {
      const violation = asObject(rawViolation)
      if (!violation) continue

      const quotaId = stringValue(violation.quotaId)
      const quotaMetric = stringValue(violation.quotaMetric)
      if (quotaId) text += ` ${quotaId}`
      if (quotaMetric) text += ` ${quotaMetric}`

      const dimensions = asObject(violation.quotaDimensions)
      if (dimensions && stringValue(dimensions.model)) hasModelDimension = true
    }
  }

  return { text: text.toLowerCase(), hasModelDimension }
}

function findRetryAfterMs(details: unknown[]): number | null {
  for (const entry of details) {
    const detail = asObject(entry)
    if (!detail) continue
    const type = stringValue(detail['@type']) ?? ''
    if (type.includes('RetryInfo')) return parseRetryDelay(detail.retryDelay)
  }
  return null
}

/**
 * Classifies a 429 response body.
 *
 * - `model`   — positive evidence the limit is scoped to one model, so the
 *               fallback model has its own quota bucket.
 * - `project` — positive evidence the limit is project/account-wide, so the
 *               fallback cannot help.
 * - `unknown` — malformed or ambiguous. Callers must treat this conservatively
 *               (do not burn the fallback on a shared quota).
 */
export function classifyRateLimit(bodyText: string): RateLimitInfo {
  let parsed: unknown
  try {
    parsed = JSON.parse(bodyText)
  } catch {
    return { scope: 'unknown', retryAfterMs: null, reason: 'unparseable-body' }
  }

  const root = asObject(parsed)
  const error = root ? asObject(root.error) : null
  if (!error) {
    return { scope: 'unknown', retryAfterMs: null, reason: 'no-error-object' }
  }

  const details = Array.isArray(error.details) ? error.details : []
  const message = (stringValue(error.message) ?? '').toLowerCase()
  const quota = collectQuotaDetails(details)
  const retryAfterMs = findRetryAfterMs(details)

  const combined = `${message} ${quota.text}`

  // Positive evidence for a model-scoped limit. The model identifier must look
  // like an actual Gemini model (`gemini-2.5-flash`, `models/gemini-...`); a
  // bare "gemini-api" documentation URL is NOT evidence of a per-model quota.
  const modelScoped =
    quota.hasModelDimension ||
    /per[_\s-]?model|model[_\s-]?specific|\bmodels\/[a-z0-9._-]+|\bgemini-\d[a-z0-9.-]*/i.test(combined)

  // Positive evidence for a project/account-wide limit.
  const projectScoped =
    /per[_\s-]?project|project[_\s-]?(?:wide|level)|project\s+(?:quota|limit)|account[_\s-]?wide|billing/.test(combined)

  // A per-project *and* per-model quota is still model-scoped: a different
  // model has its own bucket, so the fallback can succeed.
  if (modelScoped) {
    return { scope: 'model', retryAfterMs, reason: 'model-scoped-quota' }
  }
  if (projectScoped) {
    return { scope: 'project', retryAfterMs, reason: 'project-scoped-quota' }
  }
  return { scope: 'unknown', retryAfterMs, reason: 'ambiguous' }
}
