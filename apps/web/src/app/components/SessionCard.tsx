'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export type SessionModel = {
  id: string
  status?: string | null
  scheduledAt?: string | null
  coachName?: string | null
  zoomJoinUrl?: string | null
} & Record<string, unknown>

export function SessionCard({ session }: { session: SessionModel }) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('coachingDash')
  const c = useTranslations('common')

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-foreground">{session.coachName || '-'}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">
            {t('status')}: {session.status || '-'}
          </div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">
            {t('time')}: {session.scheduledAt || '-'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/dashboard/chat/${session.id}`}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-bold text-foreground hover:bg-[color:var(--surface-2)]"
          >
            {t('open_chat')}
          </Link>
          {session.zoomJoinUrl ? (
            <a
              href={session.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              {t('join')}
            </a>
          ) : (
            <span className="text-xs text-[color:var(--muted)]">{c('empty')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

