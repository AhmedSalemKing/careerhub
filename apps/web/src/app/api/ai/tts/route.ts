import { NextRequest, NextResponse } from 'next/server'

// TTS is handled client-side via Web Speech API (SpeechSynthesisUtterance).
// This endpoint exists for future Google Cloud TTS integration.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ supported: true, useClientSide: true })
}
