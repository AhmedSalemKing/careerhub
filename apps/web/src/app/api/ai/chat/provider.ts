// Provider abstraction for the chat route.
//
// One concrete provider is implemented (Gemini), because only that provider is
// configured for the Career AI flow. This is an internal seam, not a claim of
// multi-vendor support: it makes the single-model call testable and keeps HTTP
// parsing out of the route's fallback policy.
//
// No provider is invented here, and no undocumented API is used.

import type { GeminiContent } from './continuity'

export interface GeminiAttemptArgs {
  apiKey: string
  model: string
  contents: GeminiContent[]
  timeoutMs: number
  includeSystemInstruction: boolean
  systemInstruction?: string
  temperature?: number
  maxOutputTokens?: number
}

export type GeminiAttempt =
  | { kind: 'success'; text: string; ms: number }
  | { kind: 'http'; status: number; bodyText: string; ms: number }
  | { kind: 'timeout'; ms: number }
  | { kind: 'error'; message: string; ms: number }

interface GeminiResponseShape {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

/**
 * One HTTP attempt against one model.
 *
 * The abort deadline covers fetch() AND body consumption: the response body
 * inherits the request signal, so `text()`/`json()` abort mid-read as well.
 */
export async function callGeminiModel(args: GeminiAttemptArgs): Promise<GeminiAttempt> {
  const startedAt = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), args.timeoutMs)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${args.apiKey}`

  const body: Record<string, unknown> = {
    contents: args.contents,
    generationConfig: {
      temperature: args.temperature ?? 0.8,
      maxOutputTokens: args.maxOutputTokens ?? 800,
    },
  }
  if (args.includeSystemInstruction && args.systemInstruction) {
    body.system_instruction = { parts: [{ text: args.systemInstruction }] }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify(body),
    })
    const ms = Date.now() - startedAt

    if (!res.ok) {
      // Body read stays under the same abort signal.
      const bodyText = await res.text().catch(() => '')
      return { kind: 'http', status: res.status, bodyText, ms }
    }

    const data = await res.json() as GeminiResponseShape
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return { kind: 'success', text: typeof text === 'string' ? text : '', ms }
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    const ms = Date.now() - startedAt
    if (e?.name === 'AbortError') return { kind: 'timeout', ms }
    return { kind: 'error', message: e?.message ?? 'unknown', ms }
  } finally {
    clearTimeout(timer)
  }
}
