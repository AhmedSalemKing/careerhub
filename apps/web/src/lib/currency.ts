export function getMarket(): 'EGP' | 'SAR' {
  if (typeof document === 'undefined') return 'SAR'
  const match = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)
  return match?.[1]?.trim() === 'EGP' ? 'EGP' : 'SAR'
}

export function formatPrice(
  amount: number,
  currency: 'EGP' | 'SAR',
  locale?: string,
): string {
  if (amount === 0) return locale === 'ar' ? 'مجاني' : 'Free'
  if (currency === 'EGP') {
    return `${Math.round(amount).toLocaleString('ar-EG')} ج.م`
  }
  return `${amount.toLocaleString('ar-SA')} ر.س`
}
