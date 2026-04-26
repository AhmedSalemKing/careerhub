'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../../lib/unwrap'
import { AuthGate } from '../../../../components/AuthGate'
import { DashboardShell } from '../../../../components/DashboardShell'
import { Skeleton } from '../../../../components/ui/Skeleton'
import { useToast } from '../../../../../lib/toast'
import { ChatInterface, type ChatMessage } from '../../../../components/ChatInterface'

type SessionDetails = {
  id: string
  coach?: { name?: string | null } | null
  zoomJoinUrl?: string | null
  messages?: ChatMessage[] | null
} & Record<string, unknown>

export default function DashboardChatPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('chat')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>(`/coaching/sessions/${encodeURIComponent(id)}`)).data
      const data = unwrapData(raw) as any
      return (data?.session ?? data?.data?.session ?? data) as SessionDetails
    },
  })

  return (
    <AuthGate>
      <DashboardShell title={t('page_title')} subtitle={t('page_subtitle')}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={`/${locale}/dashboard/coaching`}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)]"
          >
            {c('back')}
          </Link>
          {q.data?.zoomJoinUrl ? (
            <a
              href={q.data.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              {t('join_zoom')} ↗
            </a>
          ) : null}
        </div>

        {q.isLoading ? (
          <Skeleton className="h-[60vh] rounded-2xl" />
        ) : q.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => {
                toast({ title: c('loading'), description: c('loading') })
                q.refetch()
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : !q.data?.id ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {t('empty')}
          </div>
        ) : (
          <ChatInterface sessionId={q.data.id} initialMessages={q.data.messages ?? []} />
        )}
      </DashboardShell>
    </AuthGate>
  )
}

