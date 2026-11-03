export const runtime = 'edge'

export async function GET() {
  try {
    const start = Date.now()
    const res = await fetch('https://api.deveways.com/api/health', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    const ms = Date.now() - start
    return Response.json({
      ok: res.ok,
      status: res.status,
      ms,
      time: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) })
  }
}
