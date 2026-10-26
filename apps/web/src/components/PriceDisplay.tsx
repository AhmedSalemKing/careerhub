'use client'
import { getMarket, formatPrice } from '../lib/currency'

interface Props {
  amount: number
  priceDisplay?: string | null
  locale?: string
}

export default function PriceDisplay({ amount, priceDisplay, locale }: Props) {
  if (priceDisplay) return <>{priceDisplay}</>
  const market = getMarket()
  return <>{formatPrice(amount, market, locale)}</>
}
