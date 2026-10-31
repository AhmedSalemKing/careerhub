/**
 * PROTOTYPE — isolated from production route (/api/ai/tts).
 * Do NOT use in production without completing the migration plan.
 *
 * Differences from /api/ai/tts:
 *  - Model: gemini-3.8-flash-lite-tts (GA, SSE streaming supported)
 *  - Transport: streamGenerateContent?alt=sse → ReadableStream binary PCM
 *  - Client receives: raw audio/l16; rate=24000; channels=1 binary stream
 *  - Errors: JSON response before stream starts (clear error boundary)
 *  - No PCM→WAV conversion — client uses Web Audio API directly
 *  - Quota: separate from gemini-2.5-flash-tts (different model = different counter)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 25

const MODEL   = 'gemini-3.8-flash-lite-tts'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent`

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
  const t0 = Date.now()
  console.log(`[TTS-V2] request voice=${voiceName} len=${clean.length}`)

  const abortCtrl = new AbortController()
  const timer = setTimeout(() => abortCtrl.abort(), 22000)

  let geminiRes: Response
  try {
    geminiRes = await fetch(`${ENDPOINT}?key=${apiKey}&alt=sse`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  abortCtrl.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: clean }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    })
  } catch (err: unknown) {
    clearTimeout(timer)
    const e = err as { name?: string; message?: string }
    const isAbort = e?.name === 'AbortError'
    console.error(`[TTS-V2] fetch error: ${isAbort ? 'timeout_22s' : e?.message}`)
    return NextResponse.json({ error: isAbort ? 'timeout' : 'network_error' }, { status: 503 })
  }

  // ── Gemini returned a non-2xx status — report before starting stream ──
  if (!geminiRes.ok) {
    clearTimeout(timer)
    const errText = await geminiRes.text()
    const ms = Date.now() - t0

    // Parse quota details from Gemini error body
    let errorLabel = 'provider_error'
    let retryAfterSec: number | null = null
    try {
      const errJson = JSON.parse(errText) as {
        error?: { details?: { '@type'?: string; retryDelay?: string; violations?: { quotaId?: string }[] }[] }
      }
      const details = errJson?.error?.details ?? []
      const quotaFail = details.find(d => d['@type']?.includes('QuotaFailure'))
      const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'))
      if (quotaFail) errorLabel = 'quota_exceeded'
      if (retryInfo?.retryDelay) {
        retryAfterSec = parseInt(retryInfo.retryDelay) || null
      }
    } catch { /* not JSON */ }

    if (geminiRes.status === 400) errorLabel = 'bad_request'
    if (geminiRes.status === 401 || geminiRes.status === 403) errorLabel = 'auth_error'

    console.error(`[TTS-V2] Gemini ${geminiRes.status} (${errorLabel}) after ${ms}ms`)
    return NextResponse.json(
      { error: errorLabel, retryAfterSec },
      { status: geminiRes.status === 429 ? 429 : geminiRes.status === 400 ? 400 : 503 }
    )
  }

  // ── Success: stream PCM binary to client ─────────────────────────────
  const stream = new ReadableStream({
    async start(ctrl) {
      const reader = geminiRes.body!.getReader()
      const dec    = new TextDecoder()
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
            } catch { /* skip non-JSON lines */ }
          }
        }
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string }
        if (e?.name !== 'AbortError') {
          console.error('[TTS-V2] stream relay error:', e?.message)
        }
      } finally {
        clearTimeout(timer)
        ctrl.close()
        console.log(`[TTS-V2] done voice=${voiceName} chunks=${chunkCount} pcmBytes=${byteCount} ms=${Date.now()-t0}`)
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
      'Content-Type':       'audio/l16; rate=24000; channels=1',
      'Cache-Control':      'no-store',
      'X-TTS-Voice':        voiceName,
      'X-TTS-Model':        MODEL,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
