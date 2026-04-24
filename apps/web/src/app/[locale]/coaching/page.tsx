'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { get, post } from '../../../lib/api'
import { getMediaUrl } from '../../../lib/media'
import { notify } from '../../../lib/notify'
import { useAuthStore } from '../../../stores/authStore'
import {
  Clock, Globe, Video, Phone,
  X, User,
  Briefcase, Award, MapPin
} from 'lucide-react'
import VerifiedBadge from '../../../components/VerifiedBadge'

interface Consultant {
  id: string
  hourlyRate: number
  meetingMethod: string
  bio: string
  speciality: string
  experience: number
  isVerified?: boolean
  profile: { firstName: string; lastName: string; avatar: string | null; country: string }
  _count: { consultantSessions: number }
}

function BookingModal({
  consultant,
  onClose,
  onSuccess,
}: {
  consultant: Consultant
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'details' | 'schedule' | 'confirm'>('details')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [method, setMethod] = useState<'ZOOM' | 'GOOGLE_MEET' | 'PHONE'>('ZOOM')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')

  const name = `${consultant.profile.firstName} ${consultant.profile.lastName}`
  const avatar = getMediaUrl(consultant.profile.avatar)

  const bookMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)
      const res = await post('/sessions/book', {
        consultantId: consultant.id,
        scheduledAt: scheduledAt.toISOString(),
        meetingMethod: method,
        topic,
        notes,
        duration: 60,
      })
      return (res?.data as any)?.data
    },
    onSuccess: () => {
      notify.success('تم إرسال طلب الاستشارة بنجاح!')
      onSuccess()
      onClose()
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || 'حدث خطأ في الحجز')
    }
  })

  const timeSlots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt={name} />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">
                {name[0]}
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-1.5">{name}{consultant.isVerified && <VerifiedBadge size="xs" showTooltip={false} />}</h3>
              <p className="text-xs text-[color:var(--muted)]">{consultant.speciality}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-[color:var(--surface-2)] transition">
            <X className="h-5 w-5 text-[color:var(--muted)]" />
          </button>
        </div>

        <div className="flex border-b border-[color:var(--border)]">
          {([
            { id: 'details', label: 'التفاصيل' },
            { id: 'schedule', label: 'الموعد' },
            { id: 'confirm', label: 'تأكيد' },
          ] as const).map((s, i) => (
            <div key={s.id}
              className={`flex-1 py-3 text-center text-xs font-semibold transition ${
                step === s.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-[color:var(--muted)]'
              }`}>
              {i + 1}. {s.label}
            </div>
          ))}
        </div>

        <div className="p-5">
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">موضوع الاستشارة *</label>
                <input type="text" placeholder="ما الذي تريد مناقشته؟" value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">طريقة الاجتماع *</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'ZOOM' as const, label: 'Zoom', icon: Video },
                    { id: 'GOOGLE_MEET' as const, label: 'Meet', icon: Globe },
                    { id: 'PHONE' as const, label: 'هاتف', icon: Phone },
                  ]).map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                        method === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-[color:var(--border)] hover:border-primary/40'
                      }`}>
                      <m.icon className="h-5 w-5" />{m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ملاحظات إضافية</label>
                <textarea placeholder="أي تفاصيل تريد إضافتها..." value={notes}
                  onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
              </div>
              <button onClick={() => setStep('schedule')} disabled={!topic.trim()}
                className="w-full rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                التالي — اختر الموعد
              </button>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">اختر التاريخ *</label>
                <input type="date" min={minDateStr} value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">اختر الوقت *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)}
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${
                          selectedTime === time ? 'border-primary bg-primary/15 text-primary' : 'border-[color:var(--border)] hover:border-primary/40 text-[color:var(--muted)]'
                        }`}>{time}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('details')}
                  className="flex-1 rounded-2xl border border-[color:var(--border)] py-3 text-sm hover:bg-[color:var(--surface-2)] transition">
                  السابق
                </button>
                <button onClick={() => setStep('confirm')} disabled={!selectedDate || !selectedTime}
                  className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                  التالي — تأكيد
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-lg">ملخص الحجز</h4>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] divide-y divide-[color:var(--border)]">
                {[
                  { label: 'المستشار', value: name },
                  { label: 'الموضوع', value: topic },
                  { label: 'التاريخ', value: new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'الوقت', value: selectedTime },
                  { label: 'طريقة الاجتماع', value: method === 'ZOOM' ? 'Zoom' : method === 'GOOGLE_MEET' ? 'Google Meet' : 'هاتف' },
                  { label: 'المدة', value: '60 دقيقة' },
                  { label: 'السعر', value: `${consultant.hourlyRate || 0} ريال` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-[color:var(--muted)]">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              {consultant.hourlyRate > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                  سيتم الدفع بعد تأكيد المستشار للموعد
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('schedule')}
                  className="flex-1 rounded-2xl border border-[color:var(--border)] py-3 text-sm hover:bg-[color:var(--surface-2)] transition">
                  السابق
                </button>
                <button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}
                  className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition">
                  {bookMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      جاري الحجز...
                    </span>
                  ) : 'تأكيد الحجز'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsultantModal({
  consultant,
  onClose,
  onBook,
}: {
  consultant: Consultant
  onClose: () => void
  onBook: () => void
}) {
  const name = `${consultant.profile.firstName} ${consultant.profile.lastName}`
  const avatar = getMediaUrl(consultant.profile.avatar)
  const sessions = consultant._count.consultantSessions

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden">
        <div className="relative h-32 bg-[color:var(--surface-2)]">
          <button onClick={onClose}
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-black/30 text-white hover:bg-black/50">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute -bottom-8 right-5">
            {avatar ? (
              <img src={avatar} className="h-16 w-16 rounded-2xl object-cover border-4 border-[color:var(--surface)] shadow-lg" alt={name} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary border-4 border-[color:var(--surface)] text-2xl font-bold text-white shadow-lg">
                {name[0]}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 pt-12">
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <p className="text-primary text-sm font-medium mt-0.5">{consultant.speciality}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
            {consultant.experience && (
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{consultant.experience} سنة خبرة</span>
            )}
            <span className="flex items-center gap-1"><Award className="h-4 w-4" />{sessions} جلسة مكتملة</span>
            {consultant.profile.country && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{consultant.profile.country}</span>
            )}
          </div>
          {consultant.bio && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">نبذة مهنية</h4>
              <p className="text-sm text-[color:var(--muted)] leading-relaxed">{consultant.bio}</p>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-[color:var(--muted)]">سعر الجلسة (60 دقيقة)</p>
              <p className="text-2xl font-bold text-primary mt-0.5">
                {consultant.hourlyRate || 'مجاني'} {consultant.hourlyRate ? 'ريال' : ''}
              </p>
            </div>
          </div>
          <button onClick={() => { onClose(); onBook() }}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 font-bold text-white hover:bg-primary/90 transition shadow-lg shadow-primary/20">
            احجز جلسة الآن
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoachingPage() {
  const locale = useLocale()
  const router = useRouter()
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [bookingConsultant, setBookingConsultant] = useState<Consultant | null>(null)
  const [search, setSearch] = useState('')

  const { data: consultants = [], isLoading } = useQuery<Consultant[]>({
    queryKey: ['consultants'],
    queryFn: async () => {
      const res = await get('/sessions/consultants')
      const d = (res?.data as any)?.data ?? []
      return Array.isArray(d) ? d : []
    }
  })

  const filtered = consultants.filter(c => {
    const name = `${c.profile.firstName} ${c.profile.lastName}`.toLowerCase()
    const spec = (c.speciality || '').toLowerCase()
    const q = search.toLowerCase()
    return !q || name.includes(q) || spec.includes(q)
  })

  return (
    <div className="min-h-screen p-6" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">احجز استشارة مهنية</h1>
        <p className="text-[color:var(--muted)] text-lg max-w-xl mx-auto">
          تواصل مع أفضل المستشارين المهنيين للحصول على توجيه شخصي
        </p>
      </div>
      <div className="mb-8 max-w-lg mx-auto">
        <input type="text" placeholder="ابحث عن مستشار أو تخصص..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-3.5 text-sm text-foreground focus:border-primary focus:outline-none shadow-sm" />
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-[color:var(--surface)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-[color:var(--muted)] opacity-20" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد مستشارون</h3>
          <p className="text-[color:var(--muted)]">لم يتم إضافة مستشارين بعد</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(consultant => {
            const name = `${consultant.profile.firstName} ${consultant.profile.lastName}`
            const avatar = getMediaUrl(consultant.profile.avatar)
            const sessions = consultant._count.consultantSessions
            return (
              <div key={consultant.id}
                className="group rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300">
                <div className="relative h-28 bg-[color:var(--surface-2)]">
                  <div className="absolute -bottom-7 right-5">
                    {avatar ? (
                      <img src={avatar} className="h-14 w-14 rounded-2xl object-cover border-4 border-[color:var(--surface)] shadow-md" alt={name} />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary border-4 border-[color:var(--surface)] text-xl font-bold text-white shadow-md">
                        {name[0]}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3 rounded-full bg-black/20 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-semibold">
                    {sessions} جلسة
                  </div>
                </div>
                <div className="p-5 pt-10">
                  <h3 className="font-bold text-foreground text-lg leading-tight">{name}</h3>
                  <p className="text-primary text-sm mt-0.5 font-medium">{consultant.speciality || 'مستشار مهني'}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[color:var(--muted)]">
                    {consultant.experience && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{consultant.experience} سنة</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />60 دقيقة</span>
                  </div>
                  {consultant.bio && (
                    <p className="mt-3 text-xs text-[color:var(--muted)] line-clamp-2 leading-relaxed">{consultant.bio}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-2xl font-bold text-primary">
                      {consultant.hourlyRate || 0}
                      <span className="text-sm font-normal text-[color:var(--muted)] mr-1">ريال</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedConsultant(consultant)}
                        className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[color:var(--surface-2)] transition">
                        التفاصيل
                      </button>
                      <button onClick={() => setBookingConsultant(consultant)}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm shadow-primary/20">
                        احجز
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedConsultant && (
        <ConsultantModal
          consultant={selectedConsultant}
          onClose={() => setSelectedConsultant(null)}
          onBook={() => setBookingConsultant(selectedConsultant)}
        />
      )}
      {bookingConsultant && (
        <BookingModal
          consultant={bookingConsultant}
          onClose={() => setBookingConsultant(null)}
          onSuccess={() => router.push(`/${locale}/dashboard/my-sessions`)}
        />
      )}
    </div>
  )
}