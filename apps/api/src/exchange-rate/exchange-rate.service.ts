import { Injectable } from '@nestjs/common';

@Injectable()
export class ExchangeRateService {
  private cache: { rates: { EGP: number; USD: number }; fetchedAt: number } | null = null;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  async getRates(): Promise<{ EGP: number; USD: number }> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.CACHE_TTL_MS) {
      return this.cache.rates;
    }
    const res = await fetch('https://api.frankfurter.app/latest?from=SAR&to=EGP,USD');
    const data = (await res.json()) as { rates: { EGP: number; USD: number } };
    this.cache = { rates: data.rates, fetchedAt: now };
    return data.rates;
  }

  async convert(amountSAR: number): Promise<{ sar: number; egp: number; usd: number }> {
    const rates = await this.getRates();
    return {
      sar: amountSAR,
      egp: parseFloat((amountSAR * rates.EGP).toFixed(2)),
      usd: parseFloat((amountSAR * rates.USD).toFixed(2)),
    };
  }
}
