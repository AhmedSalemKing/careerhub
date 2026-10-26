'use client'
import { formatCoursePrice } from '../lib/market'

interface Props {
  amount: number
  priceDisplay?: string | null
  locale?: string
}

export default function PriceDisplay({ amount, priceDisplay }: Props) {
  return <>{formatCoursePrice({ price: amount, priceDisplay })}</>
}
