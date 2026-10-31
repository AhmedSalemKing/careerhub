import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 25

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate   = sampleRate * channels * (bitDepth / 8)
  const blockAlign = channels * (bitDepth / 8)
  const dataSize   = pcm.length
  const buf        = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(channels, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitDepth, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  pcm.copy(buf, 44)
  return buf
}

function geminiErrorStatus(geminiStatus: number): number {
  if (geminiStatus === 429) return 429 // quota exhausted — client can fall back gracefully
  if (geminiStatus === 400) return 400 // bad request — likely invalid text or config
  if (geminiStatus === 401 || geminiStatus === 403) return 503 // auth/permission — server config issue
  if (geminiStatus === 404) return 503 // model not found
  return 503                           // 500/503/other — provider failure
}

function geminiErrorLabel(geminiStatus: number): string {
  if (geminiStatus === 429) return 'quota_exceeded'
  if (geminiStatus === 400) return 'bad_request'
  if (geminiStatus === 401) return 'unauthorized'
  if (geminiStatus === 403) return 'forbidden'
  if (geminiStatus === 404) return 'model_not_found'
  return 'provider_error'
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[TTS] GEMINI_API_KEY not set')
    return NextResponse.json({ error: 'no_key', fallback: true }, { status: 503 })
  }

  try {
    const { text, gender } = await req.json() as { text?: string; gender?: string }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'no_text', fallback: true }, { status: 400 })
    }

    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s+/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .replace(/\s+/g, ' ').trim().slice(0, 800)

    if (!clean) {
      return NextResponse.json({ error: 'empty_text', fallback: true }, { status: 400 })
    }

    const voiceName = gender === 'male' ? 'Fenrir' : 'Aoede'
    console.log(`[TTS] request voice=${voiceName} len=${clean.length}`)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)

    const t0  = Date.now()
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: clean }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          },
        }),
      }
    )
    clearTimeout(timer)
    const apiMs = Date.now() - t0

    if (!res.ok) {
      const errBody  = await res.text()
      const label    = geminiErrorLabel(res.status)
      const outStatus = geminiErrorStatus(res.status)
      console.error(`[TTS] Gemini ${res.status} (${label}) after ${apiMs}ms:`, errBody.slice(0, 300))
      return NextResponse.json({ error: label, fallback: true }, { status: outStatus })
    }

    const json = await res.json() as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[]
    }

    const part = json?.candidates?.[0]?.content?.parts?.[0]
    if (!part?.inlineData?.data) {
      console.error('[TTS] No audio in response after', apiMs, 'ms:', JSON.stringify(json).slice(0, 300))
      return NextResponse.json({ error: 'no_audio_data', fallback: true }, { status: 503 })
    }

    const mimeType: string = part.inlineData.mimeType ?? 'audio/L16;rate=24000'
    const pcmBuffer        = Buffer.from(part.inlineData.data, 'base64')

    let responseBuffer: Buffer
    let contentType: string

    if (mimeType.includes('L16') || mimeType.includes('pcm') || mimeType.includes('raw')) {
      const rateMatch  = mimeType.match(/rate=(\d+)/)
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000
      responseBuffer   = pcmToWav(pcmBuffer, sampleRate)
      contentType      = 'audio/wav'
      console.log(`[TTS] ok voice=${voiceName} pcm→wav sampleRate=${sampleRate} size=${responseBuffer.length} apiMs=${apiMs}`)
    } else {
      responseBuffer = pcmBuffer
      contentType    = mimeType.split(';')[0]
      console.log(`[TTS] ok voice=${voiceName} mimeType=${contentType} size=${responseBuffer.length} apiMs=${apiMs}`)
    }

    return new NextResponse(new Uint8Array(responseBuffer), {
      status:  200,
      headers: {
        'Content-Type':   contentType,
        'Content-Length': String(responseBuffer.length),
        'Cache-Control':  'no-store',
      },
    })
  } catch (err: unknown) {
    const e       = err as { name?: string; message?: string }
    const isAbort = e?.name === 'AbortError'
    console.error('[TTS] error:', isAbort ? 'timeout_20s' : e?.message)
    return NextResponse.json(
      { error: isAbort ? 'timeout' : 'server_error', fallback: true },
      { status: 503 }
    )
  }
}
