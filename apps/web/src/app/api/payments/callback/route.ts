import { NextRequest, NextResponse } from 'next/server'

// Stripe success_url target for course payments. This app is always awake, so the buyer never
// lands on the (possibly sleeping) API host. A plain navigation is bounced to the processing
// page, which calls this route again with json=1 to do the actual confirmation.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const API_BASE = (process.env.API_URL || 'https://api.deveways.com').replace(/\/api\/?$/, '').replace(/\/$/, '')

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

  if (!sessionId) return fail('missing_params')

  // No cookie involved: the Stripe session (validated by Stripe itself) is the only credential.
  // session-info returns the userId/courseId/courseType stored in its metadata, and the confirm
  // call derives the same values itself, so nothing here can be missing or forged.
  const infoRes = await confirmWithRetry(`${API_BASE}/api/payments/session-info?session_id=${encodeURIComponent(sessionId)}`)
  if (!infoRes?.ok) return fail(infoRes ? 'invalid_session' : 'server_unreachable')
  const info = (await infoRes.json().catch(() => null))?.data
  if (!info?.userId || !info?.courseId) return fail('missing_metadata')
  const confirmedCourseId: string = info.courseId
  const confirmedType: string = info.courseType || courseType

  const q = new URLSearchParams({ session_id: sessionId, locale, format: 'json' })
  const res = await confirmWithRetry(`${API_BASE}/api/payments/confirm?${q.toString()}`)
  if (res?.ok) {
    const ok = new URLSearchParams({ type: 'course', courseId: confirmedCourseId, courseType: confirmedType, locale, session_id: sessionId })
    return NextResponse.json({ ok: true, redirect: `/${locale}/payment/success?${ok.toString()}` })
  }
  let reason = res ? 'confirm_failed' : 'server_unreachable'
  try { reason = (await res?.json())?.reason || reason } catch { /* keep default */ }
  return fail(reason)
}
