import { type NextRequest } from 'next/server'
import { proxyCompass } from '../_proxy'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => ({}))
  return proxyCompass(req, 'career/compass/sessions', 'POST', body)
}

export async function GET(req: NextRequest) {
  return proxyCompass(req, 'career/compass/sessions', 'GET')
}
