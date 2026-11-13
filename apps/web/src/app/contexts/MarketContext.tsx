'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_MARKET,
  MARKET_CONFIG,
  MARKET_STORAGE_KEY,
  toMarket,
  type Market,
  type MarketConfigEntry,
} from '../../lib/marketConfig'

export type { Market } from '../../lib/marketConfig'
export { MARKET_CONFIG } from '../../lib/marketConfig'

interface MarketContextValue {
  market: Market
  setMarket: (m: Market) => void
  config: MarketConfigEntry
}

const MarketContext = createContext<MarketContextValue>({
  market: DEFAULT_MARKET,
  setMarket: () => {},
  config: MARKET_CONFIG[DEFAULT_MARKET],
})

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookie(): 'SAR' | 'EGP' | null {
  const v = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)?.[1]
  return v === 'EGP' || v === 'SAR' ? v : null
}

function writeCookie(m: Market) {
  document.cookie = `market=${MARKET_CONFIG[m].cookie};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`
}

/**
 * Detection order on load:
 *  1. `market` cookie: set by the user, or by middleware from the visitor's IP on first visit.
 *  2. localStorage `deveway_market`: restores the choice if the cookie was cleared.
 *  3. KSA.
 * The cookie stays the source of truth because api.ts and the server components read it.
 */
function detect(): Market {
  const cookie = readCookie()
  if (cookie) return toMarket(cookie)
  try {
    const stored = localStorage.getItem(MARKET_STORAGE_KEY)
    if (stored === 'KSA' || stored === 'EG') return stored
  } catch { /* storage blocked */ }
  return DEFAULT_MARKET
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  // Server and first client render both use the default; the real value lands after mount.
  const [market, setMarketState] = useState<Market>(DEFAULT_MARKET)

  useEffect(() => {
    const detected = detect()
    setMarketState(detected)
    // Keep cookie and localStorage in step so either one can restore the other.
    if (!readCookie()) writeCookie(detected)
    try { localStorage.setItem(MARKET_STORAGE_KEY, detected) } catch { /* ignore */ }
  }, [])

  const setMarket = useCallback((next: Market) => {
    if (next === market) return
    writeCookie(next)
    try { localStorage.setItem(MARKET_STORAGE_KEY, next) } catch { /* ignore */ }
    setMarketState(next)
    // Prices, tracks and salaries are fetched with the market baked into the request,
    // so a reload is what makes the whole app (server components included) switch at once.
    window.location.reload()
  }, [market])

  const value = useMemo(() => ({ market, setMarket, config: MARKET_CONFIG[market] }), [market, setMarket])
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket(): MarketContextValue {
  return useContext(MarketContext)
}
