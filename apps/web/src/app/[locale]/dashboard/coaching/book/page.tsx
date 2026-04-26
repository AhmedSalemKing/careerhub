'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../../lib/unwrap'
import { AuthGate } from '../../../../components/AuthGate'
import { DashboardShell } from '../../../../components/DashboardShell'
import { Skeleton } from '../../../../components/ui/Skeleton'
import { useToast } from '../../../../../lib/toast'
import { CoachCard, type CoachCardCoach } from '../../../../components/CoachCard'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { Label } from '../../../../components/ui/Label'

export default function DashboardBookCoachingPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('booking')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [payment, setPayment] = useState<'paymob' | 'hyperpay' | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [confirmation, setConfirmation] = useState<{ sessionId?: string; zoomJoinUrl?: string } | null>(null)

  const coachesQ = useQuery({
    queryKey: ['consultants', locale],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ data: any[] }>>('/sessions/consultants')).data
      const data = unwrapData(raw) as any
      return (data?.data ?? []) as CoachCardCoach[]
    },
  })

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!coachId) throw new Error('missing coach')
      const scheduledAt = `${date}T${selectedTime}:00`
      const raw = (await post<ApiEnvelope<unknown>>('/sessions/book', {
        consultantId: coachId,
        scheduledAt,
        meetingMethod: 'zoom',
        notes,
        topic: 'Career Consultation',
      })).data
      return unwrapData(raw) as any
    },
    onSuccess: (data) => {
      const session = data?.session || data?.data?.session || data?.data || data
      setConfirmation({ sessionId: session?.id, zoomJoinUrl: session?.zoomJoinUrl || session?.zoomLink })
      setStep(4)
      toast({ variant: 'success', title: t('booking_confirmed'), description: t('booking_confirmed') })
    },
    onError: () => toast({ variant: 'danger', title: t('step4_title'), description: e('something_wrong') }),
  })

  const steps = useMemo(
    () => [
      { n: 1, label: t('step1_title') },
      { n: 2, label: t('step2_title') },
      { n: 3, label: t('step3_title') },
      { n: 4, label: t('step4_title') },
    ],
    [t],
  )

  const header = steps.find((s) => s.n === step)?.label ?? t('step1_title')

  return (
    <AuthGate>
      <DashboardShell title={header} subtitle={t('payment_method')}>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {steps.map((s) => (
              <div
                key={s.n}
                className={
                  s.n === step
                    ? 'rounded-full bg-primary px-3 py-1 text-xs font-bold text-white'
                    : 'rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]'
                }
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="mt-6">
            {coachesQ.isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : coachesQ.isError ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
                <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
                <button
                  type="button"
                  className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
                  onClick={() => {
                    toast({ title: c('loading'), description: c('loading') })
                    coachesQ.refetch()
                  }}
                >
                  {c('retry')}
                </button>
              </div>
            ) : coachesQ.data?.length ? (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {coachesQ.data.map((coach) => (
                    <div key={coach.id} className="relative">
                      <CoachCard coach={coach} />
                      <Button
                        type="button"
                        className="mt-3 w-full"
                        onClick={() => {
                          setCoachId(coach.id)
                          setStep(2)
                        }}
                      >
                        {t('select_coach')}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
                {c('empty')}
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label htmlFor="date">{t('step2_title')}</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2" />
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    {c('back')}
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!date}
                  >
                    {c('next')}
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-[color:var(--muted)]">{c('empty')}</div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <div className="text-sm font-extrabold text-foreground">{t('payment_method')}</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayment('paymob')}
                className={
                  payment === 'paymob'
                    ? 'rounded-2xl border border-primary bg-[color:var(--surface)] p-5 text-sm font-bold text-foreground ring-2 ring-primary/20'
                    : 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-sm font-bold text-foreground hover:bg-[color:var(--surface-2)]'
                }
              >
                {t('paymob')}
              </button>
              <button
                type="button"
                onClick={() => setPayment('hyperpay')}
                className={
                  payment === 'hyperpay'
                    ? 'rounded-2xl border border-primary bg-[color:var(--surface)] p-5 text-sm font-bold text-foreground ring-2 ring-primary/20'
                    : 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-sm font-bold text-foreground hover:bg-[color:var(--surface-2)]'
                }
              >
                {t('hyperpay')}
              </button>
            </div>

            <div className="mt-6">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2" />
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {c('back')}
              </Button>
              <Button onClick={() => bookMutation.mutate()} disabled={!coachId || !date || bookMutation.isPending}>
                {bookMutation.isPending ? c('loading') : t('confirm_pay')}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="text-sm font-extrabold text-foreground">{t('booking_confirmed')}</div>
            {confirmation?.zoomJoinUrl ? (
              <div className="mt-4">
                <a href={confirmation.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                  {t('zoom_link')} ↗
                </a>
              </div>
            ) : null}
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = `/${locale}/dashboard/coaching`
                }}
              >
                {t('back_to_sessions')}
              </Button>
            </div>
          </div>
        ) : null}
      </DashboardShell>
    </AuthGate>
  )
}

