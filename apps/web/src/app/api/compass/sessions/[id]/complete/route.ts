import { type NextRequest } from 'next/server'
import { proxyCompass } from '../../../_proxy'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyCompass(req, `career/compass/sessions/${params.id}/complete`, 'POST')
}
