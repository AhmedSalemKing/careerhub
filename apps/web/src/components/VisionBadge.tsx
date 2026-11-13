'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useMarket } from '../app/contexts/MarketContext'
import { Flag } from '../app/components/VisionBadge'

const LOGO = { KSA: '/images/ro2ya.png', EG: '/images/egypt-vision.webp' } as const

/**
 * Vision 2030 badge for the market the visitor selected (Saudi Vision 2030 or Egypt Vision 2030),
 * in the current UI language. Pass `market` to pin a specific one instead of the selected market.
 */
export default function VisionBadge({
  market: pinned,
  showDescription = false,
  className,
}: { market?: 'KSA' | 'EG'; showDescription?: boolean; className?: string }) {
  const t = useTranslations('market.vision')
  const locale = useLocale()
  const { market: selected, config } = useMarket()
  const market = pinned ?? selected
  if (!config.vision.show) return null
  const key = market === 'EG' ? 'eg' : 'ksa'
  const name = t(key)
  return (
    <span className={`dw-vision-badge${className ? ` ${className}` : ''}`} lang={locale}>
      <img src={LOGO[market]} alt="" loading="lazy" />
      <Flag code={market} />
      <span>{name}</span>
      {showDescription && <small>{t(`${key}_desc`)}</small>}
    </span>
  )
}
