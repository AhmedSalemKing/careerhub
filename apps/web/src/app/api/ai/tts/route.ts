import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const FEMALE_VOICE = 'nova'
const MALE_VOICE   = 'onyx'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[TTS] OPENAI_API_KEY not set in environment')
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured', fallback: true }, { status: 500 })
  }

  try {
    const body = await req.json() as { text?: string; gender?: string }
    const { text, gender } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided', fallback: true }, { status: 400 })
    }

    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000)

    if (!clean) {
      return NextResponse.json({ error: 'Empty after cleaning', fallback: true }, { status: 400 })
    }

    const voice = gender === 'male' ? MALE_VOICE : FEMALE_VOICE
    console.log(`[TTS] OpenAI voice=${voice} length=${clean.length}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let openaiRes: Response
    try {
      openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: 'tts-1', voice, input: clean, response_format: 'mp3', speed: 0.95 }),
        signal:  controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '')
      console.error(`[TTS] OpenAI error: ${openaiRes.status} — ${errText.slice(0, 300)}`)
      return NextResponse.json({ error: 'OpenAI TTS failed', fallback: true }, { status: 502 })
    }

    const audioBuffer = await openaiRes.arrayBuffer()
    const audio = Buffer.from(audioBuffer)

    if (audio.length < 500) {
      console.error(`[TTS] Audio too small: ${audio.length} bytes`)
      return NextResponse.json({ error: 'Audio too small', fallback: true }, { status: 502 })
    }

    console.log(`[TTS] success voice=${voice} size=${audio.length}`)
    return new NextResponse(audio, {
      status:  200,
      headers: {
        'Content-Type':   'audio/mpeg',
        'Content-Length': audio.length.toString(),
        'Cache-Control':  'no-store',
      },
    })
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string }
    if (e?.name === 'AbortError') console.error('[TTS] OpenAI request timed out after 15s')
    else console.error('[TTS] Fatal error:', e?.message || error)
    return NextResponse.json({ error: e?.message ?? 'TTS failed', fallback: true }, { status: 500 })
  }
}
