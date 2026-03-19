'use client'

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, patch } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { useAuthStore } from '../../../../stores/authStore'

type Profile = {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  language?: string | null
} & Record<string, unknown>

export default function DashboardSettingsPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('settingsPage')
  const a = useTranslations('auth')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const updateUser = useAuthStore((s) => s.updateUser)

  const q = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ profile: Profile }>>('/api/users/profile')).data
      const data = unwrapData(raw) as any
      return (data?.profile ?? data?.data?.profile ?? null) as Profile | null
    },
  })

  const schema = z.object({
    firstName: z.string().min(1, { message: t('first_required') }),
    lastName: z.string().min(1, { message: t('last_required') }),
    phone: z.string().optional(),
  })
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  })

  useEffect(() => {
    if (q.data) {
      form.reset({
        firstName: String(q.data.firstName ?? ''),
        lastName: String(q.data.lastName ?? ''),
        phone: String(q.data.phone ?? ''),
      })
    }
  }, [q.data, form])

  const saveMutation = useMutation({
    mutationFn: async (values: Values) => {
      const raw = (await patch<ApiEnvelope<{ profile: Profile }>>('/api/users/profile', { ...values, language: locale })).data
      const data = unwrapData(raw) as any
      return (data?.profile ?? data?.data?.profile ?? null) as Profile | null
    },
    onSuccess: (profile) => {
      toast({ variant: 'success', title: t('saved'), description: t('saved') })
      if (profile) {
        updateUser({ profile: { ...(useAuthStore.getState().user?.profile ?? {}), ...profile } as any })
      }
    },
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('subtitle')}>
        {q.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
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
        ) : (
          <form
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('first_name')}</Label>
                <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
                {form.formState.errors.firstName?.message ? (
                  <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.firstName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('last_name')}</Label>
                <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
                {form.formState.errors.lastName?.message ? (
                  <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.lastName.message}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input id="phone" autoComplete="tel" {...form.register('phone')} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? c('loading') : c('save')}
              </Button>
              <a href={`/${locale}/terms`} className="inline-flex h-11 items-center px-2 text-sm font-semibold text-primary hover:underline">
                {a('terms')}
              </a>
            </div>
          </form>
        )}
      </DashboardShell>
    </AuthGate>
  )
}

