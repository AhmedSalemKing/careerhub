import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────
// Server TTS is DISABLED.
//
// Reason: OpenAI returned 429 "insufficient_quota" (org balance $0).
// Every /api/ai/tts request → 502 → forced fallback to browserTTS()
// after a 15-second wait, which caused both a delay AND the double-
// voice problem.
//
// Fix: the frontend now uses SpeechSynthesis directly. No server call.
//
// To re-enable OpenAI TTS later:
//   1. Top up $5 at https://platform.openai.com/settings/organization/billing/
//   2. git revert <this commit>  (restores the OpenAI handler)
//   3. Deploy
// ─────────────────────────────────────────────────────────────

export async function POST() {
  return NextResponse.json(
    {
      error:    'Server TTS disabled — client uses Web Speech API instead',
      fallback: true,
      reason:   'OpenAI quota exhausted ($0 balance)',
    },
    { status: 503 }
  )
}
