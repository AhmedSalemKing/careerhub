import { type NextRequest } from 'next/server'
import { proxyCompass } from '../../../_proxy'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body: unknown = await req.json().catch(() => ({}))
  return proxyCompass(req, `career/compass/sessions/${params.id}/answers`, 'POST', body)
}
