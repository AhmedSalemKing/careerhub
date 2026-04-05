'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'

export function Footer() {
  const tNav = useTranslations('nav')
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-icon.png"
              alt="DeveWay"
              style={{ height: 28, width: 'auto', background: 'transparent' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <span style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}>
              DeveWay
            </span>
          </div>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{t('about')}</p>
        </div>

        <div>
          <div className="text-sm font-semibold text-foreground">{tNav('careers')}</div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li>
              <Link className="hover:text-foreground transition-colors" href="/careers">
                {tNav('careers')}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground transition-colors" href="/pricing">
                {tNav('pricing')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-foreground">{tNav('training')}</div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li>
              <a className="hover:text-foreground transition-colors" href={TRAINING_URL} target="_blank" rel="noopener noreferrer">
                {t('all_courses')}
              </a>
            </li>
            <li>
              <a
                className="hover:text-foreground transition-colors"
                href={`${TRAINING_URL}/my-courses`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('my_courses')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-foreground">{tNav('coaches')}</div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li>
              <Link className="hover:text-foreground transition-colors" href="/coaches">
                {tNav('coaches')}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground transition-colors" href="/login">
                {tNav('login')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>{t('rights')}</div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-foreground transition-colors" href="/privacy">
              {t('privacy')}
            </Link>
            <Link className="hover:text-foreground transition-colors" href="/terms">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}