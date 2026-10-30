import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing', fallback: true }, { status: 500 })
  }

  try {
    const { text, gender } = await req.json() as { text?: string; gender?: string }
    if (!text) return NextResponse.json({ error: 'No text', fallback: true }, { status: 400 })

    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s+/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .replace(/\s+/g, ' ').trim().slice(0, 800)

    if (!clean) return NextResponse.json({ error: 'Empty', fallback: true }, { status: 400 })

    const voiceName = gender === 'male' ? 'Charon' : 'Aoede'

    console.log(`[TTS] Gemini TTS voice=${voiceName} length=${clean.length}`)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: clean }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[TTS] Gemini TTS error:', res.status, err)
      return NextResponse.json({ error: err, fallback: true }, { status: 502 })
    }

    const data = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> }
      }>
    }

    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    const mimeType  = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ?? 'audio/wav'

    if (!audioData) {
      console.error('[TTS] No audio in response:', JSON.stringify(data))
      return NextResponse.json({ error: 'No audio data', fallback: true }, { status: 502 })
    }

    const audioBuffer = Buffer.from(audioData, 'base64')
    console.log(`[TTS] success size=${audioBuffer.length} mime=${mimeType}`)

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[TTS] Error:', e?.message || error)
    return NextResponse.json({ error: e?.message || 'TTS failed', fallback: true }, { status: 500 })
  }
}
