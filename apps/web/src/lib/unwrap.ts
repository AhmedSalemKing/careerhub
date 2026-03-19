export type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

export function unwrapData<T>(res: ApiEnvelope<T> | T): T {
  if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
    const env = res as ApiEnvelope<T>
    if (typeof env.data !== 'undefined') return env.data
  }
  return res as T
}

