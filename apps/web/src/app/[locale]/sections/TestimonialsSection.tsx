'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function TestimonialsSection({ siteConfig }: { siteConfig?: Record<string, any> }) {
  const t = useTranslations('testimonials')
  const [active, setActive] = useState(0)

  const cfg = siteConfig || {}
  const dbItems = cfg['testimonials.items']

  const items: readonly { name: string; role: string; quote: string }[] =
    Array.isArray(dbItems) && dbItems.length > 0
      ? dbItems.map((item: any) => ({
          name: item.name || '',
          role: item.role || '',
          quote: item.text || item.quote || '',
        }))
      : [
          { name: t('t1_name'), role: t('t1_role'), quote: t('t1_quote') },
          { name: t('t2_name'), role: t('t2_role'), quote: t('t2_quote') },
          { name: t('t3_name'), role: t('t3_role'), quote: t('t3_quote') },
          { name: t('t4_name'), role: t('t4_role'), quote: t('t4_quote') },
        ]

  const current = items[Math.min(active, items.length - 1)]

  return (
    <section className="dw-section">
      <div className="dw-wrap">
        <div className="dw-head" style={{ marginInline: 'auto', textAlign: 'center' }}>
          <span className="dw-eyebrow">{t('badge') || 'Testimonials'}</span>
          <h2>{t('title')}</h2>
          <p>{t('subtitle')}</p>
        </div>

        <figure className="dw-review" aria-live="polite">
          <blockquote className="dw-quote">{current.quote}</blockquote>

          <figcaption className="dw-who">
            <div className="dw-avatar" aria-hidden="true">
              {current.name.charAt(0)}
            </div>
            <div>
              <div className="dw-name">{current.name}</div>
              <div className="dw-role">{current.role}</div>
            </div>
          </figcaption>
        </figure>

        {items.length > 1 && (
          <div className="dw-review-dots">
            {items.map((it, i) => (
              <button
                key={`${it.name}-${i}`}
                type="button"
                className="dw-review-dot"
                aria-label={it.name || `${i + 1}`}
                aria-current={i === active}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
