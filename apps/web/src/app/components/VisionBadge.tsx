'use client'

import type { TrackVision } from '../../lib/tracks'

/* Flags are national artwork, so their colours are the flags' own, not theme tokens. */
function Flag({ code }: { code: TrackVision }) {
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
      <circle cx="15" cy="10" r="2" fill="#C09300" />
    </svg>
  )
}

const LABEL = {
  KSA: { ar: 'رؤية السعودية 2030', en: 'Saudi Vision 2030', logo: '/images/ro2ya.png' },
  EG: { ar: 'رؤية مصر 2030', en: 'Egypt Vision 2030', logo: '/images/egypt-vision.webp' },
} as const

/** Logo + flag + name for each national vision a track is aligned with. */
export function VisionBadges({ vision, locale, compact }: { vision: readonly string[]; locale: string; compact?: boolean }) {
  const items = (['KSA', 'EG'] as const).filter((v) => vision.includes(v))
  if (items.length === 0) return null
  return (
    <div className="dw-vision-badges">
      {items.map((v) => (
        <span key={v} className={'dw-vision-badge' + (compact ? ' sm' : '')}>
          <img src={LABEL[v].logo} alt="" loading="lazy" />
          <Flag code={v} />
          <span>{locale === 'ar' ? LABEL[v].ar : LABEL[v].en}</span>
        </span>
      ))}
    </div>
  )
}
