import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Wrap raw PCM 16-bit little-endian mono audio in a WAV header.
 * Gemini TTS returns "audio/L16;rate=24000" which is raw PCM.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate   = sampleRate * numChannels * (bitDepth / 8)
  const blockAlign = numChannels * (bitDepth / 8)
  const dataSize   = pcmBuffer.length
  const buffer     = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitDepth, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  pcmBuffer.copy(buffer, 44)

  return buffer
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set', fallback: true },
      { status: 500 }
    )
  }

  try {
    const { text, gender } = await req.json() as { text?: string; gender?: string }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text', fallback: true }, { status: 400 })
    }

    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150)

    if (!clean) {
      return NextResponse.json({ error: 'Empty after cleaning', fallback: true }, { status: 400 })
    }

    const voiceName = gender === 'male' ? 'Fenrir' : 'Aoede'

    console.log(`[TTS] gemini-tts voice=${voiceName} gender=${gender} length=${clean.length}`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
    clearTimeout(timeout)

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[TTS] Gemini error:', geminiRes.status, errText.slice(0, 300))
      return NextResponse.json(
        { error: 'Gemini TTS failed', details: errText.slice(0, 200), fallback: true },
        { status: 502 }
      )
    }

    const data = await geminiRes.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> }
      }>
    }

    const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData

    if (!inlineData?.data) {
      console.error('[TTS] No inlineData in response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json(
        { error: 'No audio data from Gemini', fallback: true },
        { status: 502 }
      )
    }

    const mimeType = inlineData.mimeType ?? 'audio/L16;rate=24000'
    console.log(`[TTS] Gemini returned mimeType=${mimeType}`)

    const rawPcm = Buffer.from(inlineData.data, 'base64')
    console.log(`[TTS] voice=${voiceName} gender=${gender} audioSize=${rawPcm.length}`)
    if (rawPcm.length < 5000) {
      console.warn('[TTS] Audio too small, may be silent. Voice:', voiceName)
    }

    const rateMatch = mimeType.match(/rate=(\d+)/)
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000

    const wavBuffer = pcmToWav(rawPcm, sampleRate, 1, 16)
    console.log(`[TTS] WAV bytes=${wavBuffer.length} sampleRate=${sampleRate}`)

    return new NextResponse(new Uint8Array(wavBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const e = error as { message?: string }
    console.error('[TTS] Fatal:', e?.message || error)
    return NextResponse.json(
      { error: e?.message || 'Unknown error', fallback: true },
      { status: 500 }
    )
  }
}
