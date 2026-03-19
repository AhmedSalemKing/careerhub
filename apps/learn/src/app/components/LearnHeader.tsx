'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { MAIN_URL } from '../../lib/constants'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

export function LearnHeader() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('header')

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[color:var(--border)] bg-[color-mix(in_oklab,var(--surface),transparent_35%)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              {t('academy')}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={MAIN_URL}
            className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)] sm:inline-flex"
          >
            {t('back')}
          </a>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}

