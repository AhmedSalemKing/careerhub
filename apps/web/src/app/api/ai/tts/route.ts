import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({ error: 'TTS handled client-side', fallback: true }, { status: 503 })
}
