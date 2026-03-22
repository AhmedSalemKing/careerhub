'use client'

import { useTranslations } from 'next-intl'

export function TestimonialsSection() {
  const t = useTranslations('testimonials')

  const items = [
    { name: t('t1_name'), role: t('t1_role'), quote: t('t1_quote') },
    { name: t('t2_name'), role: t('t2_role'), quote: t('t2_quote') },
    { name: t('t3_name'), role: t('t3_role'), quote: t('t3_quote') },
    { name: t('t4_name'), role: t('t4_role'), quote: t('t4_quote') },
  ] as const

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h2>
        <p className="max-w-2xl text-sm text-[color:var(--muted)] sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((it) => (
          <figure
            key={it.name}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
          >
            <blockquote className="text-sm leading-6 text-foreground">{`“${it.quote}”`}</blockquote>
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-foreground">{it.name}</div>
                <div className="text-xs text-[color:var(--muted)]">{it.role}</div>
              </div>
              <div className="flex items-center gap-1 text-[color:var(--muted)]" aria-label={t('rating_label')}>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span className="text-foreground/40">★</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

