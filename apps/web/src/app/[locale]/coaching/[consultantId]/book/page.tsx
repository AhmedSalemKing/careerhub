'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '../../../../../lib/api'
import StayPicker from '@/components/kokonutui/stay-picker'
import { formatDateOnly, formatTimeOnly } from '@/lib/time'
import toast from 'react-hot-toast'
import { useMarket } from '../../../../contexts/MarketContext'
import { formatCurrency } from '../../../../../lib/formatCurrency'
import { toMarketAmount } from '../../../../../lib/marketConfig'
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MessageSquareText,
  StickyNote,
  X,
  User,
} from 'lucide-react'

interface ConsultantProfile {
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  bio?: string | null
  speciality?: string | null
  sessionPrice?: number | string | null
  sessionDuration?: number | null
  yearsExperience?: number | null
  rating?: number | null
}

interface Consultant {
  id: string
  email?: string
  isVerified?: boolean
  hourlyRate?: number | string | null
  profile?: ConsultantProfile | null
}

interface Slot {
  time: string
  available: boolean
  status?: string
}

const DURATION_OPTIONS = [30, 60, 90]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function userName(consultant?: Consultant | null): string {
  const first = consultant?.profile?.firstName || ''
  const last = consultant?.profile?.lastName || ''
  return `${first} ${last}`.trim() || consultant?.email || ''
}

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data
  const status = error?.response?.status
  let message = data?.message
  if (Array.isArray(message)) message = message.join(' - ')
  if (!message && typeof data === 'string') message = data
  const parts = [status ? `HTTP ${status}` : '', message || ''].filter(Boolean)
  return parts.length ? parts.join(': ') : error?.message || fallback
}

function StepTitle({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        {number}
      </span>
      <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
        {children}
      </h2>
    </div>
  )
}

export default function BookConsultingPage() {
  const { consultantId } = useParams<{ consultantId: string }>()
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { market } = useMarket()
  const money = (sar: number) => formatCurrency(toMarketAmount(sar, market), market, locale)
  const todayKey = useMemo(() => dateKey(new Date()), [])

  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [loadingConsultant, setLoadingConsultant] = useState(true)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [slots, setSlots] = useState<Slot[]>([])
  const [availability, setAvailability] = useState<Record<string, { total: number; free: number }>>({})
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [duration, setDuration] = useState(60)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const basePrice = Number(consultant?.profile?.sessionPrice ?? consultant?.hourlyRate ?? 0) || 0
  const baseDuration = Number(consultant?.profile?.sessionDuration ?? 60) || 60
  const price = useMemo(
    () => Math.round((basePrice * duration) / baseDuration),
    [basePrice, baseDuration, duration],
  )

  useEffect(() => {
    let cancelled = false
    setLoadingConsultant(true)

    const load = async () => {
      try {
        const res = await api.get(`/consulting/consultants/${consultantId}`)
        const data = res.data?.data
        if (!cancelled && data) {
          setConsultant(data)
          if (data.profile?.sessionDuration) setDuration(Number(data.profile.sessionDuration))
        }
      } catch (primaryError) {
        // Older deployments only expose the sessions consultant route.
        try {
          const res = await api.get(`/sessions/consultants/${consultantId}`)
          if (!cancelled) setConsultant(res.data?.data || null)
        } catch {
          if (!cancelled) {
            setErrorMessage(
              extractErrorMessage(primaryError, isAr ? 'تعذر تحميل بيانات المستشار' : 'Failed to load consultant'),
            )
          }
        }
      } finally {
        if (!cancelled) setLoadingConsultant(false)
      }
    }

    if (consultantId) void load()
    return () => {
      cancelled = true
    }
  }, [consultantId, isAr])

  // Slots for the selected day drive the time grid.
  useEffect(() => {
    if (!consultantId || !selectedDate) return
    let cancelled = false
    setLoadingSlots(true)
    setSelectedSlot(null)

    api
      .get(`/consulting/consultants/${consultantId}/slots`, {
        params: {
          from: selectedDate,
          to: dateKey(addDays(new Date(`${selectedDate}T12:00:00`), 1)),
          duration,
        },
      })
      .then((res) => {
        if (cancelled) return
        setSlots(Array.isArray(res.data?.data?.slots) ? res.data.data.slots : [])
      })
      .catch((error) => {
        if (cancelled) return
        setSlots([])
        setErrorMessage(extractErrorMessage(error, isAr ? 'تعذر تحميل الأوقات المتاحة' : 'Failed to load slots'))
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [consultantId, selectedDate, duration, isAr])

  // A 45-day availability window powers the booked / sold-out day marks.
  useEffect(() => {
    if (!consultantId) return
    let cancelled = false

    api
      .get(`/consulting/consultants/${consultantId}/slots`, {
        params: { from: todayKey, to: dateKey(addDays(new Date(), 45)), duration },
      })
      .then((res) => {
        if (cancelled) return
        const map: Record<string, { total: number; free: number }> = {}
        const list: Slot[] = Array.isArray(res.data?.data?.slots) ? res.data.data.slots : []
        for (const slot of list) {
          const key = dateKey(new Date(slot.time))
          if (!map[key]) map[key] = { total: 0, free: 0 }
          map[key].total += 1
          if (slot.available) map[key].free += 1
        }
        setAvailability(map)
      })
      .catch(() => {
        if (!cancelled) setAvailability({})
      })

    return () => {
      cancelled = true
    }
  }, [consultantId, duration, todayKey])

  const isDayUnavailable = useCallback(
    (key: string) => {
      const day = availability[key]
      return Boolean(day && day.total > 0 && day.free === 0)
    },
    [availability],
  )

  const handleBook = async () => {
    setErrorMessage(null)

    if (!selectedSlot) {
      setErrorMessage(isAr ? 'الرجاء اختيار وقت للجلسة' : 'Please select a session time')
      return
    }
    if (!topic.trim()) {
      setErrorMessage(isAr ? 'الرجاء إدخال موضوع الجلسة' : 'Please enter a session topic')
      return
    }

    setBooking(true)
    try {
      await api.post('/consulting/sessions/book', {
        consultantId,
        scheduledAt: selectedSlot,
        duration,
        topic: topic.trim(),
        sessionName: topic.trim(),
        notes: notes.trim() || undefined,
        description: notes.trim() || undefined,
      })

      toast.success(isAr ? 'تم إرسال طلب الحجز بنجاح' : 'Booking request sent successfully')
      router.push(`/${locale}/dashboard/my-sessions`)
    } catch (error: any) {
      // Surface the exact API message instead of a generic failure.
      const message = extractErrorMessage(error, isAr ? 'فشل حجز الجلسة' : 'Booking failed')
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setBooking(false)
    }
  }

  const summaryDate = selectedSlot
    ? formatDateOnly(selectedSlot, locale)
    : formatDateOnly(new Date(`${selectedDate}T12:00:00`), locale)
  const summaryTime = selectedSlot ? formatTimeOnly(selectedSlot, locale) : ''

  const canSubmit = Boolean(selectedSlot && topic.trim() && !booking)
  const displayName = userName(consultant)
  const freeSlots = slots.filter((slot) => slot.available).length

  const closeModal = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push(`/${locale}/coaching`)
  }, [router, locale])

  // Modal behaviour: Escape closes, page behind does not scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [closeModal])

  const card = 'rounded-2xl border p-4 sm:p-5'
  const cardStyle = { background: 'var(--surface)', borderColor: 'var(--border)' } as const

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-0 sm:p-4 sm:py-8"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'حجز جلسة استشارية' : 'Book a consulting session'}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative mx-auto w-full max-w-4xl rounded-none p-4 sm:rounded-2xl sm:p-6"
        style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)', border: '1px solid var(--border)' }}
      >
        <button
          type="button"
          onClick={closeModal}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          className="absolute top-3 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ insetInlineStart: '0.75rem', background: 'var(--surface-2)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        >
          <X size={18} />
        </button>

        <header className="mb-5 pe-0 ps-12">
          <p className="mb-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            {isAr ? 'حجز جلسة استشارية' : 'Consulting session booking'}
          </p>
          <h1 className="text-xl font-black sm:text-2xl" style={{ fontFamily: 'var(--font-madinet)' }}>
            {isAr ? 'حجز جلسة مع' : 'Book a session with'} {displayName || (isAr ? 'المستشار' : 'the consultant')}
          </h1>
        </header>

        {errorMessage && (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold"
            style={{ background: 'var(--error-subtle)', borderColor: 'var(--error)', color: 'var(--error)' }}
            role="alert"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Steps */}
          <div className="min-w-0 space-y-4">
            <section className={card} style={cardStyle}>
              <StepTitle number={1}>{isAr ? 'اختر المدة' : 'Choose a duration'}</StepTitle>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {DURATION_OPTIONS.map((option) => {
                  const active = duration === option
                  const optionPrice = Math.round((basePrice * option) / baseDuration)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDuration(option)}
                      aria-pressed={active}
                      className="rounded-xl border p-3 text-center transition-all duration-150 hover:-translate-y-px"
                      style={{
                        borderColor: active ? 'var(--primary)' : 'var(--border)',
                        background: active ? 'var(--primary-subtle)' : 'var(--surface-2)',
                        color: 'var(--foreground)',
                        borderWidth: active ? 2 : 1,
                      }}
                    >
                      <span className="block text-sm font-black" style={{ color: active ? 'var(--primary)' : 'var(--foreground)' }}>
                        {option} {isAr ? 'دقيقة' : 'min'}
                      </span>
                      <span className="mt-1 block text-xs font-bold" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
                        {optionPrice > 0 ? money(optionPrice) : isAr ? 'مجاني' : 'Free'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className={card} style={cardStyle}>
              <StepTitle number={2}>{isAr ? 'اختر التاريخ' : 'Choose a date'}</StepTitle>
              <StayPicker
                value={selectedDate}
                onChange={(next) => {
                  setSelectedDate(next)
                  setErrorMessage(null)
                }}
                isDayUnavailable={isDayUnavailable}
                minDate={todayKey}
                locale={isAr ? 'ar' : 'en'}
              />
              <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
                <CalendarDays size={13} />
                {isAr ? 'الأيام المظللة بالخطوط محجوزة بالكامل' : 'Hatched days are fully booked'}
              </p>
            </section>

            <section className={card} style={cardStyle}>
              <StepTitle number={3}>{isAr ? 'اختر الوقت' : 'Choose a time'}</StepTitle>

              {loadingSlots ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy="true">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-shimmer h-10 rounded-xl" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--muted)' }}>
                  {isAr ? 'لا توجد أوقات متاحة في هذا اليوم، اختر يوماً آخر.' : 'No times available on this day. Pick another date.'}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const active = selectedSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => slot.available && setSelectedSlot(slot.time)}
                          aria-pressed={active}
                          className="rounded-xl border px-2 py-2.5 text-xs font-bold transition-all duration-150"
                          style={{
                            borderColor: active ? 'var(--primary)' : 'var(--border)',
                            background: active ? 'var(--primary)' : 'transparent',
                            color: !slot.available ? 'var(--muted)' : active ? 'var(--primary-foreground)' : 'var(--foreground)',
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            opacity: slot.available ? 1 : 0.5,
                            textDecoration: slot.available ? 'none' : 'line-through',
                          }}
                        >
                          {formatTimeOnly(slot.time, locale)}
                          {!slot.available && (
                            <span className="mt-0.5 block text-[9px] font-bold" style={{ textDecoration: 'none' }}>
                              {isAr ? 'محجوز' : 'Booked'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? `${freeSlots} من ${slots.length} وقت متاح` : `${freeSlots} of ${slots.length} times available`}
                  </p>
                </>
              )}
            </section>

            <section className={card} style={cardStyle}>
              <StepTitle number={4}>{isAr ? 'تفاصيل الجلسة' : 'Session details'}</StepTitle>

              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--muted)' }} htmlFor="session-topic">
                <MessageSquareText size={13} />
                {isAr ? 'موضوع الجلسة' : 'Session topic'}
              </label>
              <input
                id="session-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={160}
                className="mb-4 w-full rounded-xl border p-3 text-sm outline-none transition-colors"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                placeholder={isAr ? 'مثال: مناقشة مسار التطوير' : 'e.g. Discuss my development path'}
              />

              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--muted)' }} htmlFor="session-notes">
                <StickyNote size={13} />
                {isAr ? 'ملاحظات' : 'Notes'}
              </label>
              <textarea
                id="session-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full resize-y rounded-xl border p-3 text-sm outline-none transition-colors"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                placeholder={isAr ? 'أخبر المستشار بما تحتاج مساعدة فيه' : 'Tell the consultant what you need help with'}
              />
            </section>
          </div>

          {/* Summary (below the steps on mobile, sticky side panel on desktop) */}
          <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
            <div className={card} style={{ ...cardStyle, borderColor: 'var(--primary-border)' }}>
              <div className="flex items-center gap-3">
                {consultant?.profile?.avatar ? (
                  <img src={consultant.profile.avatar} alt={displayName} className="h-12 w-12 shrink-0 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
                ) : (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black"
                    style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                  >
                    {displayName ? displayName.charAt(0) : <User size={20} />}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-sm font-black">{displayName || (isAr ? 'مستشار' : 'Consultant')}</h2>
                    {consultant?.isVerified && <BadgeCheck size={15} style={{ color: 'var(--accent)' }} aria-label={isAr ? 'موثّق' : 'Verified'} />}
                  </div>
                  <p className="truncate text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    {consultant?.profile?.speciality || (isAr ? 'استشارات مهنية' : 'Career consulting')}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between gap-2">
                  <dt style={{ color: 'var(--muted)' }}>{isAr ? 'المدة' : 'Duration'}</dt>
                  <dd className="font-bold">{duration} {isAr ? 'دقيقة' : 'min'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt style={{ color: 'var(--muted)' }}>{isAr ? 'التاريخ' : 'Date'}</dt>
                  <dd className="font-bold">{summaryDate}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt style={{ color: 'var(--muted)' }}>{isAr ? 'الوقت' : 'Time'}</dt>
                  <dd className="font-bold">{summaryTime || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <dt className="font-bold">{isAr ? 'الإجمالي' : 'Total'}</dt>
                  <dd className="text-lg font-black" style={{ color: 'var(--primary)' }}>
                    {price > 0 ? money(price) : isAr ? 'مجاني' : 'Free'}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleBook}
                disabled={!canSubmit}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all duration-150"
                style={{
                  background: canSubmit ? 'var(--primary)' : 'var(--surface-2)',
                  color: canSubmit ? 'var(--primary-foreground)' : 'var(--muted)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {booking ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                {booking ? (isAr ? 'جاري إرسال الطلب...' : 'Sending request...') : isAr ? 'تأكيد الحجز' : 'Confirm booking'}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                <Clock size={13} />
                {isAr ? 'تأكيد المستشار مطلوب' : 'Consultant approval required'}
              </p>
            </div>
          </aside>
        </div>

        {loadingConsultant && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <Loader2 size={14} className="animate-spin" />
            {isAr ? 'جاري تحميل بيانات المستشار...' : 'Loading consultant...'}
          </div>
        )}
      </div>
    </div>
  )
}
