'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '../../../../../lib/api'
import { Calendar } from 'lucide-react'

interface Consultant {
  id: string
  email: string
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
    sessionPrice?: number
    sessionDuration?: number
    speciality?: string
  }
}

interface Slot {
  time: string
  available: boolean
}

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function userName(c?: Consultant) {
  return `${c?.profile?.firstName || ''} ${c?.profile?.lastName || ''}`.trim() || c?.email || ''
}

export default function BookConsultingPage() {
  const { consultantId } = useParams<{ consultantId: string }>()
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => formatDateInput(new Date()))
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [duration, setDuration] = useState(60)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    api.get(`/consulting/consultants/${consultantId}`).then((res) => {
      setConsultant(res.data.data)
      if (res.data.data?.profile?.sessionDuration) {
        setDuration(res.data.data.profile.sessionDuration)
      }
    })
  }, [consultantId])

  useEffect(() => {
    if (!consultantId || !selectedDate) return
    const from = selectedDate
    const to = formatDateInput(addDays(new Date(selectedDate), 1))
    setLoading(true)
    api
      .get(`/consulting/consultants/${consultantId}/slots?from=${from}&to=${to}&duration=${duration}`)
      .then((res) => {
        setSlots(res.data.data?.slots || [])
        setSelectedSlot(null)
      })
      .catch((e) => console.error('[Book] slots error', e))
      .finally(() => setLoading(false))
  }, [consultantId, selectedDate, duration])

  async function handleBook() {
    if (!selectedSlot || !topic) {
      alert(isAr ? 'الرجاء اختيار وقت وإدخال الموضوع' : 'Please select a time and enter a topic')
      return
    }
    setBooking(true)
    try {
      await api.post('/consulting/sessions/book', {
        consultantId,
        scheduledAt: selectedSlot,
        duration,
        topic,
        description: notes,
        sessionName: topic,
      })
      router.push(`/${locale}/dashboard/my-sessions`)
    } catch (e: any) {
      console.error('[Book] booking error', e)
      alert(e?.response?.data?.message || (isAr ? 'فشل الحجز' : 'Booking failed'))
    }
    setBooking(false)
  }

  const weekDays = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, i) => addDays(today, i))
  }, [])

  const price = (consultant?.profile?.sessionPrice || 0) * (duration / 60)

  return (
    <div dir="rtl" className="mx-auto max-w-3xl p-4">
      <h1 className="mb-2 text-2xl font-bold">{isAr ? 'حجز جلسة استشارية' : 'Book Consulting Session'}</h1>
      {consultant && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
          <div className="h-12 w-12 rounded-full bg-[#1B4F72] text-center text-lg font-bold leading-[48px] text-white">
            {userName(consultant).charAt(0)}
          </div>
          <div>
            <div className="font-bold">{userName(consultant)}</div>
            <div className="text-sm text-[color:var(--muted)]">{consultant.profile?.speciality}</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--muted)]">{isAr ? 'اختر التاريخ' : 'Select Date'}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((d) => {
            const dateStr = formatDateInput(d)
            const active = selectedDate === dateStr
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-w-[72px] rounded-xl border p-3 text-center ${
                  active
                    ? 'border-[#1B4F72] bg-[#1B4F72] text-white'
                    : 'border-[color:var(--border)] bg-[color:var(--surface)]'
                }`}
              >
                <div className="text-xs">{d.toLocaleDateString('ar-EG', { weekday: 'short' })}</div>
                <div className="font-bold">{d.getDate()}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--muted)]">{isAr ? 'المدة' : 'Duration'}</h2>
        <div className="flex gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                duration === d ? 'border-[#1B4F72] bg-[#1B4F72] text-white' : 'border-[color:var(--border)]'
              }`}
            >
              {d} {isAr ? 'دقيقة' : 'min'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--muted)]">{isAr ? 'اختر الوقت' : 'Select Time'}</h2>
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const active = selectedSlot === slot.time
              return (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    !slot.available
                      ? 'cursor-not-allowed border-[color:var(--border)] bg-gray-100 text-[color:var(--muted)]'
                      : active
                        ? 'border-[#1B4F72] bg-[#1B4F72] text-white'
                        : 'border-[color:var(--border)] bg-[color:var(--surface)]'
                  }`}
                >
                  {new Date(slot.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  {!slot.available && <span className="mr-1 block text-[10px]">{isAr ? 'محجوز' : 'Booked'}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-[color:var(--muted)]">{isAr ? 'الموضوع' : 'Topic'}</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm"
            placeholder={isAr ? 'مثال: مناقشة مسار التطوير' : 'e.g. Career path discussion'}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-[color:var(--muted)]">{isAr ? 'ملاحظات' : 'Notes'}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm"
          />
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'السعر' : 'Price'}</span>
            <span className="text-lg font-bold text-[#1B4F72]">{price.toFixed(0)} {isAr ? 'ر.س' : 'SAR'}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleBook}
        disabled={booking || !selectedSlot || !topic}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4F72] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        <Calendar size={18} />
        {booking ? (isAr ? 'جاري الحجز...' : 'Booking...') : isAr ? 'تأكيد الحجز' : 'Confirm Booking'}
      </button>
    </div>
  )
}
