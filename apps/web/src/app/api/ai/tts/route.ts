import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Server TTS disabled — client-side Web Speech API is used instead', fallback: true },
    { status: 503 }
  )
}
