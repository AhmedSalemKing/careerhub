'use client'

import { useState, useMemo } from 'react'
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
  Briefcase, Award, MapPin,
  Search, Users
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
  const locale = useLocale()
  const isAr = locale === 'ar'
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
      notify.success(isAr ? 'تم إرسال طلب الاستشارة بنجاح!' : 'Consultation request sent successfully!')
      onSuccess()
      onClose()
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || (isAr ? 'حدث خطأ في الحجز' : 'Booking error'))
    }
  })

  const timeSlots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
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
            { id: 'details', label: isAr ? 'التفاصيل' : 'Details' },
            { id: 'schedule', label: isAr ? 'الموعد' : 'Schedule' },
            { id: 'confirm', label: isAr ? 'تأكيد' : 'Confirm' },
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
                <label className="block text-sm font-medium text-foreground mb-2">{isAr ? 'موضوع الاستشارة *' : 'Consultation Topic *'}</label>
                <input type="text" placeholder={isAr ? 'ما الذي تريد مناقشته؟' : 'What would you like to discuss?'} value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{isAr ? 'طريقة الاجتماع *' : 'Meeting Method *'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'ZOOM' as const, label: 'Zoom', icon: Video },
                    { id: 'GOOGLE_MEET' as const, label: 'Meet', icon: Globe },
                    { id: 'PHONE' as const, label: isAr ? 'هاتف' : 'Phone', icon: Phone },
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
                <label className="block text-sm font-medium text-foreground mb-2">{isAr ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea placeholder={isAr ? 'أي تفاصيل تريد إضافتها...' : 'Any details you want to add...'} value={notes}
                  onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" />
              </div>
              <button onClick={() => setStep('schedule')} disabled={!topic.trim()}
                className="w-full rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                {isAr ? 'التالي — اختر الموعد' : 'Next — Choose Time'}
              </button>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{isAr ? 'اختر التاريخ *' : 'Choose Date *'}</label>
                <input type="date" min={minDateStr} value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
              </div>
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{isAr ? 'اختر الوقت *' : 'Choose Time *'}</label>
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
                  {isAr ? 'السابق' : 'Back'}
                </button>
                <button onClick={() => setStep('confirm')} disabled={!selectedDate || !selectedTime}
                  className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                  {isAr ? 'التالي — تأكيد' : 'Next — Confirm'}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-lg">{isAr ? 'ملخص الحجز' : 'Booking Summary'}</h4>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] divide-y divide-[color:var(--border)]">
                {[
                  { label: isAr ? 'المستشار' : 'Consultant', value: name },
                  { label: isAr ? 'الموضوع' : 'Topic', value: topic },
                  { label: isAr ? 'التاريخ' : 'Date', value: new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: isAr ? 'الوقت' : 'Time', value: selectedTime },
                  { label: isAr ? 'طريقة الاجتماع' : 'Meeting Method', value: method === 'ZOOM' ? 'Zoom' : method === 'GOOGLE_MEET' ? 'Google Meet' : (isAr ? 'هاتف' : 'Phone') },
                  { label: isAr ? 'المدة' : 'Duration', value: isAr ? '60 دقيقة' : '60 minutes' },
                  { label: isAr ? 'السعر' : 'Price', value: `${consultant.hourlyRate || 0} ${isAr ? 'ريال' : 'SAR'}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-[color:var(--muted)]">{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              {consultant.hourlyRate > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                  {isAr ? 'سيتم الدفع بعد تأكيد المستشار للموعد' : 'Payment will be due after consultant confirms the appointment'}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('schedule')}
                  className="flex-1 rounded-2xl border border-[color:var(--border)] py-3 text-sm hover:bg-[color:var(--surface-2)] transition">
                  {isAr ? 'السابق' : 'Back'}
                </button>
                <button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}
                  className="flex-1 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition">
                  {bookMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {isAr ? 'جاري الحجز...' : 'Booking...'}
                    </span>
                  ) : (isAr ? 'تأكيد الحجز' : 'Confirm Booking')}
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
  const locale = useLocale()
  const isAr = locale === 'ar'
  const name = `${consultant.profile.firstName} ${consultant.profile.lastName}`
  const avatar = getMediaUrl(consultant.profile.avatar)
  const sessions = consultant._count.consultantSessions

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
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
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{consultant.experience} {isAr ? 'سنة خبرة' : 'yrs exp'}</span>
            )}
            <span className="flex items-center gap-1"><Award className="h-4 w-4" />{sessions} {isAr ? 'جلسة مكتملة' : 'sessions'}</span>
            {consultant.profile.country && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{consultant.profile.country}</span>
            )}
          </div>
          {consultant.bio && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">{isAr ? 'نبذة مهنية' : 'About'}</h4>
              <p className="text-sm text-[color:var(--muted)] leading-relaxed">{consultant.bio}</p>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-[color:var(--muted)]">{isAr ? 'سعر الجلسة (60 دقيقة)' : 'Session Price (60 min)'}</p>
              <p className="text-2xl font-bold text-primary mt-0.5">
                {consultant.hourlyRate || (isAr ? 'مجاني' : 'Free')} {consultant.hourlyRate ? (isAr ? 'ريال' : 'SAR') : ''}
              </p>
            </div>
          </div>
          <button onClick={() => { onClose(); onBook() }}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 font-bold text-white hover:bg-primary/90 transition shadow-lg shadow-primary/20">
            {isAr ? 'احجز جلسة الآن' : 'Book a Session Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoachingPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [bookingConsultant, setBookingConsultant] = useState<Consultant | null>(null)
  const [search, setSearch] = useState('')
  const [specialityFilter, setSpecialityFilter] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(6)

  const { data: consultants = [], isLoading } = useQuery<Consultant[]>({
    queryKey: ['consultants'],
    queryFn: async () => {
      const res = await get('/sessions/consultants')
      const d = (res?.data as any)?.data ?? []
      return Array.isArray(d) ? d : []
    }
  })

  const allSpecialities = useMemo(() => {
    const specs = consultants
      .map((c: any) => c.speciality)
      .filter(Boolean)
    return [...new Set(specs)] as string[]
  }, [consultants])

  const filteredConsultants = useMemo(() => {
    return (consultants || []).filter((c: any) => {
      const name = `${c.profile?.firstName || ''} ${c.profile?.lastName || ''}`.toLowerCase()
      const spec = (c.speciality || '').toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase())
      const matchFilter = !specialityFilter || c.speciality === specialityFilter
      return matchSearch && matchFilter
    })
  }, [consultants, search, specialityFilter])

  const visibleConsultants = filteredConsultants.slice(0, visibleCount)

  return (
    <div className="min-h-screen p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">{isAr ? 'احجز استشارة مهنية' : 'Book a Professional Consultation'}</h1>
        <p className="text-[color:var(--muted)] text-lg max-w-xl mx-auto">
          {isAr ? 'تواصل مع أفضل المستشارين المهنيين للحصول على توجيه شخصي' : 'Connect with top professional consultants for personalized guidance'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(6); setSpecialityFilter(null) }}
            placeholder={isAr ? 'ابحث عن مستشار...' : 'Search consultants...'}
            className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-12 py-3.5 text-sm text-foreground focus:border-primary focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Speciality filters */}
      {allSpecialities.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 max-w-lg mx-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { setSpecialityFilter(null); setVisibleCount(6) }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              !specialityFilter ? 'bg-primary text-white' : 'bg-[color:var(--surface-2)] text-[color:var(--muted)]'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          {allSpecialities.map((s: string) => (
            <button
              key={s}
              onClick={() => { setSpecialityFilter(s); setVisibleCount(6) }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
                specialityFilter === s ? 'bg-primary text-white' : 'bg-[color:var(--surface-2)] text-[color:var(--muted)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-[color:var(--surface)]" />
          ))}
        </div>
      ) : filteredConsultants.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-[color:var(--muted)] opacity-20" />
          <h3 className="text-xl font-bold text-foreground mb-2">{isAr ? 'لا يوجد مستشارون مطابقون' : 'No consultants found'}</h3>
          <p className="text-[color:var(--muted)]">{isAr ? 'جرب فلتر مختلف' : 'Try a different filter'}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleConsultants.map(consultant => {
              const name = `${consultant.profile.firstName} ${consultant.profile.lastName}`
              const avatar = getMediaUrl(consultant.profile.avatar)
              const sessions = consultant._count.consultantSessions
              return (
                <div key={consultant.id}
                  className="group rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-28 bg-[color:var(--surface-2)]">
                    <div className="absolute -bottom-7 right-5">
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {avatar ? (
                          <img src={avatar} className="h-14 w-14 rounded-2xl object-cover border-4 border-[color:var(--surface)] shadow-md" alt={name} />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary border-4 border-[color:var(--surface)] text-xl font-bold text-white shadow-md">
                            {name[0]}
                          </div>
                        )}
                        {consultant.isVerified && <VerifiedBadge size="xs" onAvatar showTooltip={false} />}
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 rounded-full bg-black/20 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-semibold">
                      {sessions} {isAr ? 'جلسة' : 'sessions'}
                    </div>
                  </div>
                  <div className="p-5 pt-10">
                    <h3 className="font-bold text-foreground text-lg leading-tight">{name}</h3>
                    {consultant.speciality && (
                      <p className="text-primary text-sm mt-0.5 font-medium">{consultant.speciality}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-[color:var(--muted)]">
                      {consultant.experience && (
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{consultant.experience} {isAr ? 'سنة' : 'yrs'}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{isAr ? '60 دقيقة' : '60 min'}</span>
                    </div>
                    {consultant.bio && (
                      <p className="mt-3 text-xs text-[color:var(--muted)] line-clamp-2 leading-relaxed">{consultant.bio}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-2xl font-bold text-primary">
                        {consultant.hourlyRate || 0}
                        <span className="text-sm font-normal text-[color:var(--muted)] mr-1">{isAr ? 'ريال' : 'SAR'}</span>
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedConsultant(consultant)}
                          className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[color:var(--surface-2)] transition">
                          {isAr ? 'التفاصيل' : 'Details'}
                        </button>
                        <button onClick={() => setBookingConsultant(consultant)}
                          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm shadow-primary/20">
                          {isAr ? 'احجز' : 'Book'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {visibleCount < filteredConsultants.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount(v => v + 6)}
                className="rounded-2xl border border-[color:var(--border)] px-8 py-3 text-sm font-semibold hover:bg-[color:var(--surface-2)] transition"
              >
                {isAr ? `عرض المزيد (${filteredConsultants.length - visibleCount})` : `Load More (${filteredConsultants.length - visibleCount})`}
              </button>
            </div>
          )}
        </>
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