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
          <div className="text-base font-bold">
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              CareerHub
            </span>
          </div>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{t('about')}</p>
        </div>

        <div>
          <div className="text-sm font-semibold text-foreground">{tNav('careers')}</div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li>
              <Link className="hover:text-foreground" href="/careers">
                {tNav('careers')}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/pricing">
                {tNav('pricing')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-foreground">{tNav('training')}</div>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            {/* ⚠️ LEGAL: External links — Saudi e-learning licensing */}
            <li>
              <a className="hover:text-foreground" href={TRAINING_URL} target="_blank" rel="noopener noreferrer">
                {t('all_courses')}
              </a>
            </li>
            <li>
              <a
                className="hover:text-foreground"
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
              <Link className="hover:text-foreground" href="/coaches">
                {tNav('coaches')}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/login">
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
            <Link className="hover:text-foreground" href="/privacy">
              {t('privacy')}
            </Link>
            <Link className="hover:text-foreground" href="/terms">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
