export type Quota429Type = 'model_rate_limit' | 'account_quota' | 'unknown'

/**
 * Parses a Gemini 429 response body to classify the quota type.
 * Returns 'model_rate_limit' for per-minute throttling (safe to try fallback),
 * 'account_quota' for daily/free-tier limits (fallback will also fail),
 * or 'unknown' when the structure is absent or unrecognised.
 */
export function classify429Body(bodyText: string): Quota429Type {
  try {
    const body = JSON.parse(bodyText) as {
      error?: {
        details?: Array<{
          '@type'?: string
          reason?: string
          metadata?: { quota_metric?: string; quota_id?: string }
        }>
      }
    }
    const details = body?.error?.details ?? []
    for (const d of details) {
      if (typeof d['@type'] === 'string' && d['@type'].includes('ErrorInfo')) {
        const metric = (d?.metadata?.quota_metric ?? '').toLowerCase()
        if (metric.includes('per_minute') || metric.includes('minute') || metric.includes('requests_per_min')) {
          return 'model_rate_limit'
        }
        if (metric.includes('per_day') || metric.includes('day') || metric.includes('free_tier') || metric.includes('free')) {
          return 'account_quota'
        }
      }
    }
  } catch { /* non-JSON body — treat as unknown */ }
  return 'unknown'
}
