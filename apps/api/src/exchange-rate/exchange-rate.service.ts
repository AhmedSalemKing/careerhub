import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name)
  private cachedRates: { EGP: number; USD: number } | null = null
  private cacheTime = 0
  private readonly CACHE_TTL = 60 * 60 * 1000 // 1 hour

  private externalFailedAt: number | null = null
  private readonly EXTERNAL_BLOCK_TTL = 60 * 60 * 1000 // 1 hour

  async getRates(): Promise<{ EGP: number; USD: number }> {
    const now = Date.now()

    // Return cached rate if still valid
    if (this.cachedRates && now - this.cacheTime < this.CACHE_TTL) {
      return this.cachedRates
    }

    // Skip external APIs if they failed recently — use fallback immediately
    if (this.externalFailedAt && now - this.externalFailedAt < this.EXTERNAL_BLOCK_TTL) {
      return this.cachedRates ?? { EGP: 15.0027, USD: 0.2667 }
    }

    // Primary source: exchangerate.host (free, no key, hourly updates)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(
        'https://api.exchangerate.host/latest?base=SAR&symbols=EGP,USD',
        { signal: controller.signal }
      )
      clearTimeout(timer)
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
        this.externalFailedAt = null // reset on success
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
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(
        'https://api.frankfurter.app/latest?from=SAR&to=EGP,USD',
        { signal: controller.signal }
      )
      clearTimeout(timer)
      const data = (await res.json()) as {
        rates?: { EGP?: number; USD?: number }
      }
      if (data?.rates?.EGP) {
        this.cachedRates = {
          EGP: data.rates.EGP,
          USD: data.rates.USD ?? 0.2667,
        }
        this.cacheTime = now
        this.externalFailedAt = null // reset on success
        this.logger.log(
          `Rates [frankfurter]: 1 SAR = ${this.cachedRates.EGP} EGP`
        )
        return this.cachedRates
      }
    } catch {
      this.logger.warn('frankfurter.app failed, using cached or hardcoded rates')
    }

    // After all sources fail, block external APIs for 1 hour
    this.externalFailedAt = Date.now()

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
