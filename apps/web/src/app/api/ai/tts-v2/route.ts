/**
 * TTS v2 — Streaming PCM via Gemini SSE.
 *
 * Model: gemini-2.5-flash-preview-tts (dedicated TTS model).
 * Two attempts are made with the same model to handle transient network
 * failures. quota_exceeded on attempt 1 means quota is exhausted for this
 * model — a second attempt with the same model cannot recover from that.
 *
 * Immediate fail, no retry:
 *   auth_error (401/403), bad_request (400) — same key/payload, retry cannot help
 *
 * Retry IS attempted for:
 *   timeout / network_error — transient failure, one more try is worth it
 *   provider_error (503)    — transient provider unavailability
 *
 * Total time budget: 22 s across all attempts (maxDuration = 25 s)
 *
 * Client receives:  audio/l16; rate=24000; channels=1 binary stream
 * Errors:           JSON before stream starts (clear error boundary)
 * No PCM→WAV conversion — client uses Web Audio API (decodeL16PCM in useStreamingTTS)
 *
 * Voice: always Charon (male Arabic). Female voice is not offered.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '../_auth'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 25

const PRIMARY_MODEL   = 'gemini-2.5-flash-preview-tts'
const SECONDARY_MODEL = 'gemini-2.5-flash-preview-tts'

function streamUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`
}

function cleanText(raw: string): string {
  return raw
    .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
    .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/DeveWay/gi, 'ديفي واي')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800)
}

type ErrorLabel = 'quota_exceeded' | 'auth_error' | 'bad_request' | 'timeout' | 'network_error' | 'provider_error' | 'no_key'

function parseGeminiError(errText: string, httpStatus: number): {
  label:         ErrorLabel
  geminiStatus:  string
  geminiReason:  string
  retryAfterSec: number | null
} {
  // Start from HTTP status alone — body details refine this below
  let label: ErrorLabel =
    httpStatus === 400               ? 'bad_request'    :
    (httpStatus === 401 || httpStatus === 403) ? 'auth_error' : 'provider_error'

  let geminiStatus  = ''
  let geminiReason  = ''
  let retryAfterSec: number | null = null

  try {
    const errJson = JSON.parse(errText) as {
      error?: {
        status?:  string
        message?: string
        details?: { '@type'?: string; reason?: string; retryDelay?: string }[]
      }
    }
    geminiStatus = errJson?.error?.status ?? ''
    geminiReason = errJson?.error?.details?.find(d => d.reason)?.reason ?? ''
    const retryInfo = errJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'))
    if (retryInfo?.retryDelay) retryAfterSec = parseInt(retryInfo.retryDelay) || null

    // Body-driven quota classification: covers RESOURCE_EXHAUSTED (daily) and RATE_LIMIT_EXCEEDED (RPM)
    if (geminiStatus === 'RESOURCE_EXHAUSTED' || geminiStatus === 'RATE_LIMIT_EXCEEDED') {
      label = 'quota_exceeded'
    }
  } catch { /* non-JSON body */ }

  // HTTP 429 fallback: body was non-JSON or carried an unrecognised status — still a rate-limit
  if (httpStatus === 429 && label === 'provider_error') label = 'quota_exceeded'

  return { label, geminiStatus, geminiReason, retryAfterSec }
}

/**
 * Returns true for errors where a secondary model with the same key is guaranteed to fail.
 * quota_exceeded is NOT included: a transient rate-limit may clear quickly,
 * so a second attempt on the same model is worth one retry.
 */
function isFinalError(label: ErrorLabel): boolean {
  return label === 'auth_error' || label === 'bad_request'
}

export async function POST(req: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────────
  const authUser = await verifyRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[TTS-V2] GEMINI_API_KEY not set')
    return NextResponse.json({ error: 'no_key' }, { status: 503 })
  }

  let body: { text?: string; gender?: string }
  try {
    body = await req.json() as { text?: string; gender?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { text, gender } = body
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'no_text' }, { status: 400 })
  }

  const clean = cleanText(text)
  if (!clean) {
    return NextResponse.json({ error: 'empty_text' }, { status: 400 })
  }

  // Always male voice — female option is not offered by this service.
  // Charon: male Arabic prebuilt voice (language-adaptive, works for Arabic and English).
  const voiceName = 'Charon'
  void gender  // parameter kept for API compatibility; value is ignored
  const t0        = Date.now()
  const reqId     = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  console.log(`[TTS-V2] req=${reqId} voice=${voiceName} len=${clean.length}`)

  const geminiBody = JSON.stringify({
    contents: [{ parts: [{ text: clean }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  })

  const models: string[] = [PRIMARY_MODEL, SECONDARY_MODEL]

  // Wall-clock budget shared across all model attempts — stays within maxDuration=25s.
  // Fast failures (quota/404/503) resolve in <1s so the secondary gets nearly the full budget.
  // If the primary genuinely times out the secondary gets only the leftover ms, which may
  // be insufficient for a full TTS stream — that is acceptable: a double-timeout is
  // already an extreme failure and the client falls back to text-only.
  const BUDGET_MS   = 22000
  const budgetStart = Date.now()

  // Remember the primary's error for a more informative final response when both models fail.
  let firstModelError: { label: ErrorLabel; retryAfterSec: number | null } | null = null

  for (let mi = 0; mi < models.length; mi++) {
    const model      = models[mi]
    const isRetry    = mi > 0

    const elapsed   = Date.now() - budgetStart
    const remaining = BUDGET_MS - elapsed
    if (remaining <= 500) {
      // Budget nearly spent — no point starting another attempt
      console.warn(`[TTS-V2] req=${reqId} budget_exhausted elapsed=${elapsed}ms`)
      break
    }
    const attemptMs = Math.min(remaining - 300, 20000)

    const abortCtrl = new AbortController()
    const timer     = setTimeout(() => abortCtrl.abort(), attemptMs)

    // ── Fetch Gemini SSE stream ──────────────────────────────────────────
    let geminiRes: Response
    try {
      geminiRes = await fetch(streamUrl(model, apiKey), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortCtrl.signal,
        body:    geminiBody,
      })
    } catch (err: unknown) {
      clearTimeout(timer)
      const e        = err as { name?: string; message?: string }
      const isAbort  = e?.name === 'AbortError'
      const errLabel = isAbort ? 'timeout' : 'network_error'
      console.error(`[TTS-V2] req=${reqId} model=${model} fetch_error=${errLabel}${isRetry ? ' (secondary)' : ''}`)

      if (mi + 1 < models.length) {
        console.warn(`[TTS-V2] req=${reqId} falling back to secondary (${errLabel})`)
        continue
      }
      return NextResponse.json({ error: errLabel }, { status: 503 })
    }

    // ── Non-2xx from Gemini ──────────────────────────────────────────────
    if (!geminiRes.ok) {
      clearTimeout(timer)
      const errText = await geminiRes.text()
      const ms      = Date.now() - t0
      const { label, geminiStatus, geminiReason, retryAfterSec } =
        parseGeminiError(errText, geminiRes.status)

      console.error(`[TTS-V2] req=${reqId} model=${model} http=${geminiRes.status} label=${label} gemini_status=${geminiStatus} reason=${geminiReason} ms=${ms}${isRetry ? ' (secondary)' : ''}`)

      if (!isRetry) firstModelError = { label, retryAfterSec }

      // auth_error and bad_request: same key / same content — secondary cannot help
      if (isFinalError(label)) {
        return NextResponse.json(
          { error: label, retryAfterSec },
          { status: geminiRes.status === 400 ? 400 : 503 }
        )
      }

      // quota_exceeded, provider_error, timeout, network_error: try secondary if available
      if (mi + 1 < models.length) {
        console.warn(`[TTS-V2] req=${reqId} model=${model} failed (${label}), trying secondary`)
        continue
      }

      // Both models exhausted — prefer the primary's quota error over secondary's provider_error
      const finalLabel = (label === 'provider_error' && firstModelError?.label === 'quota_exceeded')
        ? 'quota_exceeded'
        : label
      const finalRetryAfterSec = finalLabel === firstModelError?.label
        ? firstModelError.retryAfterSec
        : retryAfterSec
      const finalStatus = finalLabel === 'quota_exceeded' ? 429 : 503
      console.error(`[TTS-V2] req=${reqId} all_models_exhausted primary=${firstModelError?.label} final=${finalLabel}`)
      return NextResponse.json({ error: finalLabel, retryAfterSec: finalRetryAfterSec }, { status: finalStatus })
    }

    // ── Success: relay PCM binary stream to client ───────────────────────
    const capturedModel = model
    const stream = new ReadableStream({
      async start(ctrl) {
        const reader    = geminiRes.body!.getReader()
        const dec       = new TextDecoder()
        let   sseBuffer = ''
        let   chunkCount = 0
        let   byteCount  = 0

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            sseBuffer += dec.decode(value, { stream: true })
            const lines = sseBuffer.split('\n')
            sseBuffer   = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const dataStr = line.slice(6).trim()
              if (!dataStr) continue
              try {
                const evt  = JSON.parse(dataStr) as {
                  candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[]
                }
                const part = evt?.candidates?.[0]?.content?.parts?.[0]
                if (part?.inlineData?.data) {
                  const pcm = Buffer.from(part.inlineData.data, 'base64')
                  ctrl.enqueue(new Uint8Array(pcm))
                  chunkCount++
                  byteCount += pcm.length
                }
              } catch { /* skip non-JSON SSE lines */ }
            }
          }
        } catch (err: unknown) {
          const e = err as { name?: string; message?: string }
          if (e?.name !== 'AbortError') {
            console.error(`[TTS-V2] req=${reqId} stream_relay_error:`, e?.message)
          }
        } finally {
          clearTimeout(timer)
          ctrl.close()
          const tag = isRetry ? ' (secondary)' : ''
          console.log(`[TTS-V2] req=${reqId} done model=${capturedModel}${tag} voice=${voiceName} chunks=${chunkCount} pcmBytes=${byteCount} ms=${Date.now()-t0}`)
        }
      },
      cancel() {
        clearTimeout(timer)
        abortCtrl.abort()
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type':           'audio/l16; rate=24000; channels=1',
        'Cache-Control':          'no-store',
        'X-TTS-Voice':            voiceName,
        'X-TTS-Model':            capturedModel,
        'X-TTS-Request-Id':       reqId,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  // Unreachable — loop always returns or falls through above
  return NextResponse.json({ error: 'provider_error' }, { status: 503 })
}
