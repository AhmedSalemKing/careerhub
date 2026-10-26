import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name)
  private cachedRates: { EGP: number; USD: number } | null = null
  private cacheTime = 0
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  async getRates(): Promise<{ EGP: number; USD: number }> {
    const now = Date.now()
    if (this.cachedRates && now - this.cacheTime < this.CACHE_TTL) {
      return this.cachedRates
    }

    // Primary source: exchangerate.host (free, no key, hourly updates)
    try {
      const res = await fetch(
        'https://api.exchangerate.host/latest?base=SAR&symbols=EGP,USD'
      )
      const data = (await res.json()) as {
        rates?: { EGP?: number; USD?: number }
        success?: boolean
      }
      if (data?.rates?.EGP) {
        this.cachedRates = {
          EGP: data.rates.EGP,
          USD: data.rates.USD ?? 0.2667,
        }
        this.cacheTime = now
        this.logger.log(
          `Rates [exchangerate.host]: 1 SAR = ${this.cachedRates.EGP} EGP`
        )
        return this.cachedRates
      }
    } catch {
      this.logger.warn('exchangerate.host failed, trying frankfurter...')
    }

    // Fallback 1: frankfurter.app (ECB, daily update)
    try {
      const res = await fetch(
        'https://api.frankfurter.app/latest?from=SAR&to=EGP,USD'
      )
      const data = (await res.json()) as {
        rates?: { EGP?: number; USD?: number }
      }
      if (data?.rates?.EGP) {
        this.cachedRates = {
          EGP: data.rates.EGP,
          USD: data.rates.USD ?? 0.2667,
        }
        this.cacheTime = now
        this.logger.log(
          `Rates [frankfurter]: 1 SAR = ${this.cachedRates.EGP} EGP`
        )
        return this.cachedRates
      }
    } catch {
      this.logger.warn('frankfurter.app failed, using cached or hardcoded rates')
    }

    // Fallback 2: stale cached value
    if (this.cachedRates) {
      this.logger.warn(`Using stale cached rates: ${JSON.stringify(this.cachedRates)}`)
      return this.cachedRates
    }

    // Fallback 3: hardcoded rates (update periodically)
    // Last verified: 2026-10-26
    this.logger.error('All rate sources failed. Using hardcoded fallback rates.')
    return { EGP: 15.0027, USD: 0.2667 }
  }

  async convert(amountSAR: number): Promise<{ sar: number; egp: number; usd: number }> {
    const rates = await this.getRates()
    return {
      sar: amountSAR,
      egp: parseFloat((amountSAR * rates.EGP).toFixed(2)),
      usd: parseFloat((amountSAR * rates.USD).toFixed(2)),
    }
  }

  async getSARtoEGPRate(): Promise<number> {
    const rates = await this.getRates()
    return rates.EGP
  }
}
