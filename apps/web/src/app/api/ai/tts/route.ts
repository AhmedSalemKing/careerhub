import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 500 })
  }

  try {
    const { text, gender } = await req.json() as { text?: string; gender?: string }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text' }, { status: 400 })
    }

    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .trim()
      .slice(0, 1000)

    if (!clean) return NextResponse.json({ error: 'Empty text' }, { status: 400 })

    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: clean },
          voice: {
            languageCode: 'ar-XA',
            name: gender === 'male' ? 'ar-XA-Standard-B' : 'ar-XA-Standard-A',
            ssmlGender: gender === 'male' ? 'MALE' : 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: gender === 'male' ? -2.0 : 0.0,
            volumeGainDb: 2.0,
          },
        }),
      }
    )

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text()
      console.error('[TTS] Google TTS error:', ttsRes.status, errBody)
      return NextResponse.json(
        { error: 'Google TTS unavailable', fallback: true },
        { status: 502 }
      )
    }

    const data = await ttsRes.json() as { audioContent?: string }
    const audioContent = data.audioContent

    if (!audioContent) {
      return NextResponse.json({ error: 'No audio' }, { status: 502 })
    }

    return NextResponse.json({ audio: audioContent, type: 'mp3' })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[TTS] Error:', e?.message || error)
    return NextResponse.json({ error: e?.message || 'Unknown error', fallback: true }, { status: 500 })
  }
}
