'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '../../../../../lib/api'
import StayPicker from '@/components/kokonutui/stay-picker'
import { formatDateOnly, formatTimeOnly } from '@/lib/time'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MessageSquareText,
  StickyNote,
  Star,
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

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10"
      style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}
    >
      <header className="mb-6">
        <p className="mb-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
          {isAr ? 'حجز جلسة استشارية' : 'Consulting session booking'}
        </p>
        <h1 className="text-2xl font-black sm:text-3xl" style={{ fontFamily: 'var(--font-madinet)' }}>
          {isAr ? 'حجز جلسة مع' : 'Book a session with'} {displayName || (isAr ? 'المستشار' : 'the consultant')}
        </h1>
      </header>

      <section
        className="mb-6 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          {consultant?.profile?.avatar ? (
            <img
              src={consultant.profile.avatar}
              alt={displayName}
              className="h-14 w-14 rounded-2xl object-cover"
              style={{ border: '1px solid var(--border)' }}
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
              style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
            >
              {displayName ? displayName.charAt(0) : <User size={22} />}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate text-base font-black">{displayName || (isAr ? 'مستشار' : 'Consultant')}</h2>
              {consultant?.isVerified && (
                <BadgeCheck size={16} style={{ color: 'var(--accent)' }} aria-label={isAr ? 'موثّق' : 'Verified'} />
              )}
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {consultant?.profile?.speciality || (isAr ? 'استشارات مهنية' : 'Career consulting')}
            </p>
            {consultant?.profile?.yearsExperience ? (
              <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr ? `${consultant.profile.yearsExperience} سنة خبرة` : `${consultant.profile.yearsExperience} years experience`}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="flex items-center gap-2 self-start rounded-xl px-3 py-2 text-xs font-bold sm:self-center"
          style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
        >
          <Star size={14} />
          {typeof consultant?.profile?.rating === 'number'
            ? consultant.profile.rating.toFixed(1)
            : isAr
              ? 'مستشار معتمد'
              : 'Verified consultant'}
        </div>
      </section>

      {errorMessage && (
        <div
          className="mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold"
          style={{ background: 'var(--error-subtle)', borderColor: 'var(--error)', color: 'var(--error)' }}
          role="alert"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      <div className="space-y-5">
        <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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
                    background: active ? 'var(--primary-subtle)' : 'var(--surface)',
                    color: 'var(--foreground)',
                    boxShadow: active ? '0 4px 14px var(--primary-subtle)' : 'none',
                  }}
                >
                  <span className="block text-sm font-black" style={{ color: active ? 'var(--primary)' : 'var(--foreground)' }}>
                    {option} {isAr ? 'دقيقة' : 'min'}
                  </span>
                  <span className="mt-1 block text-xs font-bold" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
                    {optionPrice > 0 ? `${optionPrice} ${isAr ? 'ر.س' : 'SAR'}` : isAr ? 'مجاني' : 'Free'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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

        <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <StepTitle number={3}>{isAr ? 'اختر الوقت' : 'Choose a time'}</StepTitle>

          {loadingSlots ? (
            <div className="flex items-center gap-2 py-6 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
              <Loader2 size={16} className="animate-spin" />
              {isAr ? 'جاري تحميل الأوقات...' : 'Loading times...'}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}>
              {isAr ? 'لا توجد أوقات متاحة في هذا اليوم، اختر يوماً آخر.' : 'No times available on this day. Pick another date.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
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
                        background: !slot.available
                          ? 'var(--surface)'
                          : active
                            ? 'var(--primary)'
                            : 'var(--surface)',
                        color: !slot.available
                          ? 'var(--muted)'
                          : active
                            ? 'var(--primary-foreground)'
                            : 'var(--foreground)',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.55,
                        textDecoration: slot.available ? 'none' : 'line-through',
                        boxShadow: active ? '0 4px 12px var(--primary-subtle)' : 'none',
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
                {isAr
                  ? `${freeSlots} من ${slots.length} وقت متاح`
                  : `${freeSlots} of ${slots.length} times available`}
              </p>
            </>
          )}
        </section>

        <section className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
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
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
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
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            placeholder={isAr ? 'أخبر المستشار بما تحتاج مساعدة فيه' : 'Tell the consultant what you need help with'}
          />
        </section>

        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--primary-border)' }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'ملخص الحجز' : 'Booking summary'}
              </p>
              <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>
                {selectedSlot ? (
                  <>
                    {summaryDate} {isAr ? 'الساعة' : 'at'} {summaryTime} — {duration} {isAr ? 'دقيقة' : 'min'} —{' '}
                    <span style={{ color: 'var(--primary)' }}>
                      {price > 0 ? `${price} ${isAr ? 'ر.س' : 'SAR'}` : isAr ? 'مجاني' : 'Free'}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'اختر التاريخ والوقت أولاً' : 'Select a date and time first'}</span>
                )}
              </p>
            </div>

            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              <Clock size={14} />
              {isAr ? 'تأكيد المستشار مطلوب' : 'Consultant approval required'}
            </div>
          </div>

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
            {booking
              ? isAr
                ? 'جاري إرسال الطلب...'
                : 'Sending request...'
              : isAr
                ? 'تأكيد الحجز'
                : 'Confirm booking'}
          </button>
        </section>
      </div>

      {loadingConsultant && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <Loader2 size={14} className="animate-spin" />
          {isAr ? 'جاري تحميل بيانات المستشار...' : 'Loading consultant...'}
        </div>
      )}
    </div>
  )
}
