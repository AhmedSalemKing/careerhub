'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Rocket, Star } from 'lucide-react'
import type { Track } from '../../lib/tracks'
import { VisionBadges } from './VisionBadge'

/** Track cards shared by the home page section and /careers (same .tcard markup as the careers page). */
export function TracksGrid({ tracks }: { tracks: Track[] }) {
  const locale = useLocale()
  const router = useRouter()
  const ar = locale === 'ar'
  const nf = ar ? 'ar-EG' : 'en-US'
  return (
    <div className="dw-tracks-grid">
      {tracks.map((t, idx) => {
        const coursesCount = (() => {
          try {
            const c: unknown = typeof t.courses === 'string' ? JSON.parse(t.courses) : t.courses
            return Array.isArray(c) ? c.length : (t.courseCount ?? 0)
          } catch { return t.courseCount ?? 0 }
        })()
        const roles = (t.jobs ?? []).slice(0, 3).map((j) => j.title).filter(Boolean)
        const href = `/${locale}/careers/${t.slug}`
        return (
          <article
            key={t.id}
            className="tcard rv"
            role="link"
            tabIndex={0}
            onClick={() => router.push(href)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) router.push(href) }}
            style={{ cursor: 'pointer', ...({ ['--d' as string]: `${(idx % 3) * 80}ms` } as React.CSSProperties) }}
          >
            <div className="t-media">
              {t.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="t-cover" src={t.coverImage} alt="" loading="lazy" />
              )}
              <span className="t-badge"><Rocket className="icon" size={18} aria-hidden="true" /></span>
              <span className="t-count">
                <Star className="icon" size={13} aria-hidden="true" />
                {ar
                  ? `${coursesCount.toLocaleString(nf)} دورات · ${t.weeks.toLocaleString(nf)} أسبوعًا`
                  : `${coursesCount} courses · ${t.weeks} weeks`}
              </span>
            </div>
            <div className="t-body">
              <h3>{t.name}</h3>
              {t.description && <p className="t-desc">{t.description}</p>}
              {roles.length > 0 && <div className="roles">{roles.map((r, i) => <span key={`${r}-${i}`}>{r}</span>)}</div>}
              {t.vision2030?.length > 0 && <VisionBadges vision={t.vision2030} locale={locale} compact />}
              <div className="t-foot">
                <button type="button" className="t-btn" onClick={(e) => { e.stopPropagation(); router.push(href) }}>{ar ? 'تفاصيل' : 'Details'}</button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
