import { NextRequest, NextResponse } from 'next/server'

// Stripe success_url target for course payments. This app is always awake, so the buyer never
// lands on the (possibly sleeping) API host. A plain navigation is bounced to the processing
// page, which calls this route again with json=1 to do the actual confirmation.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const API_BASE = (process.env.API_URL || 'https://api.deveways.com').replace(/\/api\/?$/, '').replace(/\/$/, '')

function userIdFromJwt(token?: string): string | null {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json)
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

// The API may be waking up: retry gateway errors and network failures for a while.
async function confirmWithRetry(url: string): Promise<Response | null> {
  const deadline = Date.now() + 50_000
  let last: Response | null = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(Math.max(5_000, deadline - Date.now())) })
      if (![502, 503, 504].includes(res.status)) return res
      last = res
    } catch {
      /* network error while the API boots: retry */
    }
    await new Promise((r) => setTimeout(r, 3_000))
  }
  return last
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const locale = sp.get('locale') === 'en' ? 'en' : 'ar'
  const sessionId = sp.get('session_id') || ''
  const courseId = sp.get('courseId') || ''
  const courseType = sp.get('courseType') || 'recorded'
  const wantsJson = sp.get('json') === '1'

  if (!wantsJson) {
    const url = new URL(`/${locale}/payment-processing`, req.url)
    sp.forEach((v, k) => url.searchParams.set(k, v))
    return NextResponse.redirect(url)
  }

  const fail = (reason: string) =>
    NextResponse.json({ ok: false, reason, redirect: `/${locale}/payment-failed?reason=${encodeURIComponent(reason)}&courseId=${encodeURIComponent(courseId)}` })

  if (!sessionId || !courseId) return fail('missing_params')

  const userId = userIdFromJwt(req.cookies.get('careerhub_token')?.value) || sp.get('userId') || ''
  if (!userId) return fail('not_signed_in')

  const q = new URLSearchParams({ session_id: sessionId, courseId, userId, courseType, locale, format: 'json' })
  const res = await confirmWithRetry(`${API_BASE}/api/payments/confirm?${q.toString()}`)
  if (res?.ok) {
    const ok = new URLSearchParams({ type: 'course', courseId, courseType, locale, session_id: sessionId })
    return NextResponse.json({ ok: true, redirect: `/${locale}/payment/success?${ok.toString()}` })
  }
  let reason = res ? 'confirm_failed' : 'server_unreachable'
  try { reason = (await res?.json())?.reason || reason } catch { /* keep default */ }
  return fail(reason)
}
