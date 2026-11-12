'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { trackSalarySpan, type Track } from '../../lib/tracks'
import { VisionBadges } from './VisionBadge'

/** Track cards shared by the home page section and /careers. */
export function TracksGrid({ tracks }: { tracks: Track[] }) {
  const locale = useLocale()
  const ar = locale === 'ar'
  const nf = ar ? 'ar-EG' : 'en-US'
  return (
    <div className="dw-tracks-grid">
      {tracks.map((t) => {
        const salary = trackSalarySpan(t, locale)
        return (
          <Link key={t.id} href={`/${locale}/careers/${t.slug}`} className="dw-track-card rv">
            <h3>{t.name}</h3>
            <p className="dw-track-meta">
              {ar
                ? `${t.courseCount.toLocaleString(nf)} دورات · ${t.weeks.toLocaleString(nf)} أسبوعًا · ${t.jobCount.toLocaleString(nf)} وظائف`
                : `${t.courseCount} courses · ${t.weeks} weeks · ${t.jobCount} jobs`}
            </p>
            {t.description && <p className="dw-track-desc">{t.description}</p>}
            <VisionBadges vision={t.vision2030} locale={locale} compact />
            <div className="dw-track-foot">
              {salary ? <span className="dw-track-sal"><small>{ar ? 'الراتب المتوقع' : 'Expected salary'}</small><b>{salary}</b></span> : <span />}
              <span className="dw-track-go">{ar ? 'اعرف أكثر' : 'Learn more'}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
