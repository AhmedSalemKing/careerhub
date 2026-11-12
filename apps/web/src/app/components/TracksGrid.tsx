'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { formatTrackPrice, type Track } from '../../lib/tracks'
import { VisionBadges } from './VisionBadge'

/** Track cards shared by the home page section and /careers. */
export function TracksGrid({ tracks }: { tracks: Track[] }) {
  const locale = useLocale()
  const ar = locale === 'ar'
  return (
    <div className="dw-tracks-grid">
      {tracks.map((t) => (
        <Link key={t.id} href={`/${locale}/careers/${t.slug}`} className="dw-track-card rv">
          <h3>{t.name}</h3>
          <p className="dw-track-meta">
            {ar
              ? `${t.courseCount.toLocaleString('ar-EG')} دورات · ${t.weeks.toLocaleString('ar-EG')} أسبوعًا`
              : `${t.courseCount} courses · ${t.weeks} weeks`}
          </p>
          {t.description && <p className="dw-track-desc">{t.description}</p>}
          <VisionBadges vision={t.vision2030} locale={locale} compact />
          <div className="dw-track-foot">
            {t.price != null && <b>{formatTrackPrice(t.price, t.currency, locale)}</b>}
            <span className="dw-track-go">{ar ? 'اعرف أكثر' : 'Learn more'}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
