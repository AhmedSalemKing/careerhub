/**
 * TTS v2 — Streaming PCM via Gemini SSE.
 *
 * Models tried in order:
 *   1. gemini-3.8-flash-lite-tts  (primary — lower quota usage, faster)
 *   2. gemini-3.8-flash-tts       (secondary — same key; 404/503/timeout fallback only)
 *
 * Immediate fail (no secondary attempt):
 *   quota_exceeded (429 / RESOURCE_EXHAUSTED), auth_error, bad_request
 *
 * Client receives:  audio/l16; rate=24000; channels=1 binary stream
 * Errors:           JSON before stream starts (clear error boundary)
 * No PCM→WAV conversion — client uses Web Audio API (decodeL16PCM in useStreamingTTS)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 25

const PRIMARY_MODEL   = 'gemini-3.8-flash-lite-tts'
const SECONDARY_MODEL = 'gemini-3.8-flash-tts'

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
  let label: ErrorLabel =
    httpStatus === 429               ? 'quota_exceeded' :
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
    if (geminiStatus === 'RESOURCE_EXHAUSTED') label = 'quota_exceeded'
  } catch { /* non-JSON body */ }

  return { label, geminiStatus, geminiReason, retryAfterSec }
}

/** Returns true for errors where trying a second model with the same key is pointless */
function isFinalError(label: ErrorLabel): boolean {
  return label === 'quota_exceeded' || label === 'auth_error' || label === 'bad_request'
}

export async function POST(req: NextRequest) {
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

  const voiceName = gender === 'male' ? 'Fenrir' : 'Aoede'
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

  for (let mi = 0; mi < models.length; mi++) {
    const model      = models[mi]
    const isRetry    = mi > 0

    const abortCtrl = new AbortController()
    const timer     = setTimeout(() => abortCtrl.abort(), 22000)

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

      // Quota / auth / bad-request: secondary won't help
      if (isFinalError(label)) {
        return NextResponse.json(
          { error: label, retryAfterSec },
          { status: geminiRes.status === 429 ? 429 : geminiRes.status === 400 ? 400 : 503 }
        )
      }

      // 404 / 503 / other: try secondary if available
      if (mi + 1 < models.length) {
        console.warn(`[TTS-V2] req=${reqId} model=${model} failed (${label}), trying secondary`)
        continue
      }

      // All models exhausted
      return NextResponse.json({ error: label, retryAfterSec }, { status: 503 })
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
