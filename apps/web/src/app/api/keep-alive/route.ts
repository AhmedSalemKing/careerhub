import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await fetch('https://deve-way.onrender.com/api/health', { 
      signal: AbortSignal.timeout(5000) 
    })
  } catch(e) {}
  return NextResponse.json({ ok: true })
}
