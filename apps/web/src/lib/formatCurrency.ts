import type { Market } from './marketConfig'

/** "8,000 SAR" / "٨٬٠٠٠ ر.س" — amount plus the market's currency, in the UI language. */
export function formatCurrency(amount: number, market: Market, locale: string): string {
  if (locale === 'en') {
    return `${amount.toLocaleString('en-US')} ${market === 'KSA' ? 'SAR' : 'EGP'}`
  }
  return market === 'KSA'
    ? `${amount.toLocaleString('ar-SA')} ر.س`
    : `${amount.toLocaleString('ar-EG')} ج.م`
}
