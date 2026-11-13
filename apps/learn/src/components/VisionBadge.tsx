'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useMarket } from '../app/contexts/MarketContext'

const LOGO = { KSA: '/images/ro2ya.png', EG: '/images/egypt-vision.webp' } as const

/* Flags are national artwork, so their colours are the flags' own, not theme tokens. */
export function Flag({ code }: { code: 'KSA' | 'EG' }) {
  return code === 'KSA' ? (
    <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
      <rect width="30" height="20" rx="2" fill="#006C35" />
      <path d="M7 8.2c1.2-1.6 2.4 1 3.6-.4s1.6-1.6 2.6-.2 1.8.6 2.8-.6 1.6 1.4 3 .2 1.8-.6 3.6-.8" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M8 13.4h13.5l-1.4 1.2M8 13.4l-.8-.9" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
      <rect width="30" height="6.67" rx="2" fill="#CE1126" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" rx="2" fill="#000" />
      <circle cx="15" cy="10" r="2.5" fill="#C09300" />
    </svg>
  )
}

/** Vision 2030 badge for the SELECTED market only, in the current UI language. */
export default function VisionBadge({ compact, showDescription = false }: { compact?: boolean; showDescription?: boolean }) {
  const t = useTranslations('market.vision')
  const locale = useLocale()
  const { market, config } = useMarket()
  if (!config.vision.show) return null
  const key = market === 'EG' ? 'eg' : 'ksa'
  return (
    <span className={`dw-vision-badge${compact ? ' sm' : ''}`} lang={locale}>
      <img src={LOGO[market]} alt="" loading="lazy" />
      <Flag code={market} />
      <span>{t(key)}</span>
      {showDescription && <small>{t(`${key}_desc`)}</small>}
    </span>
  )
}
