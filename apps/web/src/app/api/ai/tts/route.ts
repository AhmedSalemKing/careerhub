import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, gender } = body as { text?: string; gender?: string }

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
      .slice(0, 800)

    if (!clean) {
      return NextResponse.json({ error: 'Empty after cleaning', fallback: true }, { status: 400 })
    }

    const voice = gender === 'male' ? 'ar-SA-HamedNeural' : 'ar-SA-ZariyahNeural'

    console.log(`[TTS] voice=${voice} text_length=${clean.length}`)

    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts')

    const tts = new MsEdgeTTS()
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('TTS timeout after 20s')), 20000)

      const { audioStream } = tts.toStream(clean)

      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      })
      audioStream.on('end', () => {
        clearTimeout(timeout)
        resolve()
      })
      audioStream.on('error', (err: Error) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No audio chunks received', fallback: true }, { status: 502 })
    }

    const audio = Buffer.concat(chunks)
    console.log(`[TTS] success, audio size=${audio.length} bytes`)

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length.toString(),
        'Cache-Control': 'no-store',
        'X-TTS-Voice': voice,
      },
    })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[TTS] Error:', e?.message || error)
    return NextResponse.json(
      { error: e?.message || 'TTS failed', fallback: true },
      { status: 500 }
    )
  }
}
