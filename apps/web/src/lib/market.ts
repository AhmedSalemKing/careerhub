export function getMarket(): 'EGP' | 'SAR' {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)
    return (m?.[1] as 'EGP' | 'SAR') ?? 'SAR'
  }
  return 'SAR'
}

export function getCountryParam(): string {
  return getMarket() === 'EGP' ? 'country=EG' : ''
}

export async function getMarketServer(): Promise<{ market: 'EGP' | 'SAR'; country: string }> {
  const { cookies, headers } = await import('next/headers')
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('market')?.value as 'EGP' | 'SAR' | undefined
  const hdrs = await headers()
  const fromHeader = hdrs.get('x-vercel-ip-country') ?? hdrs.get('cf-ipcountry') ?? ''
  const country = fromCookie === 'EGP' ? 'EG' : fromHeader || 'SA'
  const market: 'EGP' | 'SAR' = country === 'EG' ? 'EGP' : 'SAR'
  return { market, country }
}
