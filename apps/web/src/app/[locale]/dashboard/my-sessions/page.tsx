'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import {
  Calendar, Clock, Video, CheckCircle2, XCircle,
  ExternalLink, Plus, RefreshCw, Link2, X,
  Copy, Check, CreditCard, DollarSign,
  AlertTriangle, User, Users
} from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'
import ConfirmModal from '@/components/ConfirmModal'
import toast from 'react-hot-toast'
import { formatDate, formatTimeOnly, localDateTimeToISO } from '@/lib/time'

const formatTimeSlot = (time: string, isAr: boolean): string => {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const formatted = `${hour12}:${m.toString().padStart(2, '0')} ${period}`
  return isAr ? formatted.replace('AM', 'ص').replace('PM', 'م') : formatted
}

const STATUS_CONFIG: Record<string, any> = {
  PENDING:              { ar:'قيد الانتظار',    en:'Pending',            color:'#d97706', bg:'rgba(245,158,11,0.1)' },
  CONFIRMED:            { ar:'مؤكدة',           en:'Confirmed',          color:'#5120c8', bg:'rgba(81,32,200,0.1)'  },
  SCHEDULED:            { ar:'مجدولة',          en:'Scheduled',          color:'#0ea5e9', bg:'rgba(14,165,233,0.1)' },
  COMPLETED:            { ar:'مكتملة',          en:'Completed',          color:'#16a34a', bg:'rgba(22,163,74,0.1)'  },
  EXPIRED:              { ar:'منتهية',          en:'Expired',            color:'#6b7280', bg:'rgba(107,114,128,0.1)'},
  CANCELLED:            { ar:'ملغاة',           en:'Cancelled',          color:'#dc2626', bg:'rgba(220,38,38,0.1)'  },
  NO_SHOW:              { ar:'لم يحضر',         en:'No Show',            color:'#dc2626', bg:'rgba(220,38,38,0.08)' },
  RESCHEDULE_REQUESTED: { ar:'طلب تغيير موعد',  en:'Reschedule Pending', color:'#7c3aed', bg:'rgba(124,58,237,0.1)' },
}

type ViewType = 'my' | 'client'

export default function MySessionsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const accountType = user?.accountType || 'STUDENT'

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; destructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [activeTab, setActiveTab] = useState<'upcoming'|'completed'|'cancelled'>('upcoming')
  const [viewType, setViewType] = useState<ViewType>('my')
  const [rescheduleModal, setRescheduleModal] = useState<any>(null)
  const [linkModal, setLinkModal] = useState<any>(null)
  const [linkValue, setLinkValue] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [copied, setCopied] = useState('')
  const [paymentSession, setPaymentSession] = useState<any>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const r = await get('/consulting/sessions')
      const data = r.data?.data
      return {
        mySessions: data?.mySessions ?? [],
        clientSessions: data?.clientSessions ?? [],
      }
    },
    refetchInterval: 30000,
  })

  const mySessions: any[] = sessionsData?.mySessions ?? []
  const clientSessions: any[] = sessionsData?.clientSessions ?? []

  useEffect(() => {
    if (accountType === 'CONSULTANT' && clientSessions.length > 0 && viewType === 'my') {
      setViewType('client')
    }
  }, [accountType, clientSessions.length])

  const sessions: any[] = viewType === 'client' ? clientSessions : mySessions

  const upcomingStatuses = ['PENDING','CONFIRMED','SCHEDULED','RESCHEDULE_REQUESTED']
  const completedStatuses = ['COMPLETED','NO_SHOW']
  const cancelledStatuses = ['CANCELLED','EXPIRED']

  const filtered = sessions.filter((s: any) => {
    if (activeTab === 'upcoming') return upcomingStatuses.includes(s.status)
    if (activeTab === 'completed') return completedStatuses.includes(s.status)
    return cancelledStatuses.includes(s.status)
  })

  const upcomingCount = sessions.filter((s: any) => upcomingStatuses.includes(s.status)).length

  const paySession = async (sessionId: string) => {
    setPayingId(sessionId)
    try {
      await post(`/consulting/sessions/${sessionId}/pay`)
      toast.success(isAr ? 'تم الدفع بنجاح!' : 'Payment successful!')
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
    } catch(e: any) {
      toast.error(e.message || (isAr ? 'خطأ في الدفع' : 'Payment error'))
    } finally {
      setPayingId(null)
    }
  }

  const completeMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/complete`, {}),
    onSuccess: () => { toast.success(isAr ? 'تم تاكيد اكتمال الجلسة' : 'Session completed'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/cancel`, {}),
    onSuccess: () => { toast.success(isAr ? 'تم الغاءالجلسة' : 'Session cancelled'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, proposedAt, reason }: any) =>
      patch(`/consulting/sessions/${id}/request-reschedule`, { proposedAt, reason }),
    onSuccess: () => {
      toast.success(isAr ? 'تم ارسال طلب تغيير الموعد' : 'Reschedule request sent')
      setRescheduleModal(null)
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
    },
    onError: (e: any) => toast.error(e?.message || (isAr ? 'حدث خطا' : 'Error'))
  })

  const approveRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/approve-reschedule`, {}),
    onSuccess: () => { toast.success(isAr ? 'تمت الموافقة' : 'Approved'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const rejectRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/reject-reschedule`, {}),
    onSuccess: () => { toast.success(isAr ? 'تم الرفض' : 'Rejected'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const addLinkMutation = useMutation({
    mutationFn: ({ id, link }: any) => {
      if (!link.includes('zoom.us') && !link.includes('meet.google.com'))
        throw new Error(isAr ? 'يقب فقط روابط Zoom او Google Meet' : 'Only Zoom or Google Meet allowed')
      return patch(`/consulting/sessions/${id}/meeting-link`, { meetingLink: link })
    },
    onSuccess: () => {
      toast.success(isAr ? 'تم اضافة رابط الاجتماع' : 'Meeting link added')
      setLinkModal(null); setLinkValue('')
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
    },
    onError: (e: any) => toast.error(e?.message || (isAr ? 'حدث خطا' : 'Error'))
  })

  const isSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 3600000
  }
  const isLinkExpired = (s: any) => {
    if (!s.meetingLinkExpiresAt) return false
    return new Date(s.meetingLinkExpiresAt) < new Date()
  }

  const SessionCard = ({ session }: { session: any }) => {
    const conf = STATUS_CONFIG[session.status] || STATUS_CONFIG.PENDING
    const soon = isSoon(session.scheduledAt)
    const isRescheduleReq = session.status === 'RESCHEDULE_REQUESTED'
    const isUpcoming = upcomingStatuses.includes(session.status)
    const isPaid = session.paymentStatus === 'PAID'
    const linkExpired = isLinkExpired(session)
    const other = viewType === 'client' ? session.student : session.consultant
    const otherName = other ? `${other.profile?.firstName || ''} ${other.profile?.lastName || ''}`.trim() || '' : ''
    const roleLabel = viewType === 'client' ? (isAr ? 'العميل' : 'Client') : (isAr ? 'المستشار' : 'Consultant')

    return (
      <div style={{
        background: cardBg, borderRadius: 18,
        border: `1.5px solid ${soon ? 'rgba(81,32,200,0.5)' : (isRescheduleReq ? 'rgba(124,58,237,0.4)' : border)}`,
        overflow: 'hidden',
        boxShadow: soon ? '0 0 0 4px rgba(81,32,200,0.06)' : 'none',
        transition: 'all 0.2s',
      }}>
        {soon && !isRescheduleReq && (
          <div style={{ padding: '8px 20px', background: 'rgba(81,32,200,0.1)', borderBottom: '1px solid rgba(81,32,200,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={13} color="#5120c8" />
            <span style={{ color: '#5120c8', fontSize: 12, fontWeight: 700 }}>
              {isAr ? 'الجلسة ستبدأ خلال أقل من ساعة' : 'Session starts in less than 1 hour'}
            </span>
          </div>
        )}

        {isRescheduleReq && (
          <div style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <AlertTriangle size={14} color="#7c3aed" />
            <span style={{ color: '#7c3aed', fontSize: 12, fontWeight: 700, flex: 1 }}>
              {isAr ? 'المستشار اقترح موعداً جديداً  هل توافق؟' : 'Consultant proposed a new time  do you approve?'}
              {session.proposedAt && (
                <span style={{ marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0, color: '#5120c8', fontWeight: 800 }}>
                  {' '}{formatDate(session.proposedAt, locale)} {formatTimeOnly(session.proposedAt)}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => approveRescheduleMutation.mutate(session.id)} disabled={approveRescheduleMutation.isPending} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.15)', color: 'rgb(22,163,74)', border: '1px solid rgba(22,163,74,0.4)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {isAr ? 'موافقة' : 'Approve'}
              </button>
              <button onClick={() => rejectRescheduleMutation.mutate(session.id)} disabled={rejectRescheduleMutation.isPending} style={{ padding: '5px 12px', borderRadius: 8, background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {isAr ? 'رفض' : 'Reject'}
              </button>
            </div>
          </div>
        )}

        {session.meetingLink && linkExpired && (
          <div style={{ padding: '8px 20px', background: 'rgba(107,114,128,0.08)', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={13} color="#6b7280" />
            <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 600 }}>
              {isAr ? 'تم انتهاء صلاحية رابط الاجتماع' : 'Meeting link has expired'}
            </span>
          </div>
        )}

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {other?.profile?.avatar
                ? <img src={other.profile.avatar} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5120c8', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{otherName?.[0] || '?'}</div>}
              <div>
                <div style={{ color: subtext, fontSize: 11, fontWeight: 600, marginBottom: 1 }}>
                  {roleLabel}
                </div>
                <div style={{ color: text, fontSize: 15, fontWeight: 800 }}>{otherName}</div>
                {other?.profile?.speciality && (
                  <div style={{ color: '#5120c8', fontSize: 11, fontWeight: 600 }}>{other.profile.speciality}</div>
                )}
                {session.sessionName && (
                  <div style={{ color: subtext, fontSize: 11, marginTop: 2 }}>
                    {isAr ? 'الجلسة: ' : 'Session: '}<span style={{ color: text, fontWeight: 600 }}>{session.sessionName}</span>
                  </div>
                )}
                {session.topic && (
                  <div style={{ color: subtext, fontSize: 11 }}>
                    {isAr ? 'الهدف: ' : 'Goal: '}{session.topic}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ padding: '4px 10px', borderRadius: 20, background: conf.bg, border: `1px solid ${conf.color}30`, color: conf.color, fontSize: 11, fontWeight: 700 }}>
                {isAr ? conf.ar : conf.en}
              </div>
              {isUpcoming && (
                <div style={{ padding: '4px 10px', borderRadius: 20, background: isPaid ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isPaid ? 'rgba(22,163,74,0.2)' : 'rgba(245,158,11,0.2)'}`, color: isPaid ? '#16a34a' : '#d97706', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <DollarSign size={10} />
                  {isPaid ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid')}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', border: `1px solid ${border}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} color={subtext} />
              <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{formatDate(session.scheduledAt, locale)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} color={subtext} />
              <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{formatTimeOnly(session.scheduledAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Video size={12} color={subtext} />
              <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{session.meetingType === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
            </div>
            {session.duration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} color={subtext} />
                <span style={{ color: subtext, fontSize: 12 }}>{session.duration} {isAr ? 'دقيقة' : 'min'}</span>
              </div>
            )}
          </div>

          {session.meetingLink && !linkExpired && (
            <div style={{ padding: '9px 12px', borderRadius: 10, marginBottom: 12, background: 'rgba(81,32,200,0.06)', border: '1px solid rgba(81,32,200,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={12} color="#5120c8" />
              <span style={{ color: '#5120c8', fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.meetingLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(session.meetingLink); setCopied(session.id); setTimeout(() => setCopied(''), 2000) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5120c8', flexShrink: 0 }}>
                {copied === session.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              </button>
              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 7, background: '#5120c8', color: '#ffffff', textDecoration: 'none', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                <ExternalLink size={10} />{isAr ? 'انضم' : 'Join'}
              </a>
            </div>
          )}

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {session.meetingLink && !linkExpired && isUpcoming && (
              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: '#5120c8', color: '#ffffff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                <Video size={12} />{isAr ? 'انضم للجلسة' : 'Join Session'}
              </a>
            )}

            {(session.price || 0) > 0 && !isPaid && isUpcoming && !isRescheduleReq && (
              <button onClick={() => paySession(session.id)}
                disabled={payingId === session.id}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'rgba(22,163,74,0.15)', color: 'rgb(22,163,74)', border: '1px solid rgba(22,163,74,0.4)', cursor: payingId === session.id ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700, opacity: payingId === session.id ? 0.7 : 1 }}>
                <CreditCard size={12} />{payingId === session.id ? (isAr ? 'جاري الدفع...' : 'Processing...') : (isAr ? `ادفع ${session.price} ر.س` : `Pay ${session.price} SAR`)}
              </button>
            )}

            {viewType === 'my' && !isPaid && isUpcoming && !(session.price || 0) && (
              <button
                onClick={async () => {
                  try {
                    await post(`/consulting/sessions/${session.id}/confirm-payment`, { paymentIntentId: 'free' })
                    toast.success(isAr ? 'تم تأكيد الجلسة المجانية!' : 'Free session confirmed!')
                    qc.invalidateQueries({ queryKey: ['my-sessions'] })
                  } catch(e) {
                    toast.error(isAr ? 'حدث خطأ حاول مرة أخرى' : 'Error, please try again')
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(22,163,74,0.1)', color: '#16a34a',
                  border: '1px solid rgba(22,163,74,0.3)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>
                <CheckCircle2 size={12} />
                {isAr ? 'تأكيد الجلسة المجانية' : 'Confirm Free Session'}
              </button>
            )}

            {isPaid && isUpcoming && session.status !== 'COMPLETED' && session.meetingLink && !isRescheduleReq && (
              <button onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: isAr ? 'اكتمال الجلسة' : 'Complete Session',
                  message: isAr ? 'هل أنت متأكد من تأكيد اكتمال الجلسة؟' : 'Are you sure you want to mark this session as completed?',
                  destructive: false,
                  onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    completeMutation.mutate(session.id)
                  },
                })
              }} disabled={completeMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: completeMutation.isPending ? 0.7 : 1 }}>
                <CheckCircle2 size={12} />{isAr ? 'أكمل الجلسة' : 'Mark Complete'}
              </button>
            )}

            {isUpcoming && !isPaid && !isRescheduleReq && (
              <button onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: isAr ? 'إلغاء الجلسة' : 'Cancel Session',
                  message: isAr ? 'هل أنت متأكد من إلغاء هذه الجلسة؟' : 'Are you sure you want to cancel this session?',
                  destructive: true,
                  onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    cancelMutation.mutate(session.id)
                  },
                })
              }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.04)', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                <XCircle size={11} />{isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '26px 24px 0', borderBottom: `1px solid ${border}`, background: cardBg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={19} color="#5120c8" />
              </div>
              <div>
                <h1 style={{ color: text, fontSize: 19, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                  {isAr ? 'جلساتي الاستشارية' : 'My Consulting Sessions'}
                </h1>
                <p style={{ color: subtext, fontSize: 11, margin: 0 }}>
                  {isAr ? `${sessions.length} جلسة إجمالاً` : `${sessions.length} total sessions`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: subtext, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <RefreshCw size={12} />{isAr ? 'تحديث' : 'Refresh'}
              </button>
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                <Plus size={12} />{isAr ? 'جلسة جديدة' : 'New Session'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { val: mySessions.filter((s: any) => upcomingStatuses.includes(s.status)).length, ar: 'جلساتي القادمة', en: 'My Upcoming', color: '#5120c8', bg: 'rgba(81,32,200,0.08)' },
              { val: mySessions.filter((s: any) => s.status === 'COMPLETED').length, ar: 'مكتملة', en: 'Completed', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : s.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.color, fontSize: 18, fontWeight: 900 }}>{s.val}</span>
                <span style={{ color: subtext, fontSize: 11 }}>{isAr ? s.ar : s.en}</span>
              </div>
            ))}
            {accountType === 'CONSULTANT' && clientSessions.length > 0 && (
              <div style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${border}`, background: viewType === 'client' ? 'rgba(81,32,200,0.08)' : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'), display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setViewType(v => v === 'client' ? 'my' : 'client')}>
                <Users size={16} color={viewType === 'client' ? '#5120c8' : subtext} />
                <div>
                  <div style={{ color: viewType === 'client' ? '#5120c8' : text, fontSize: 18, fontWeight: 900 }}>{clientSessions.filter((s: any) => upcomingStatuses.includes(s.status)).length}</div>
                  <div style={{ color: subtext, fontSize: 11 }}>{isAr ? 'جلسات العملاء' : 'Client Sessions'}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', borderBottom: 'none', gap: 0 }}>
            {[
              { key: 'upcoming' as const, ar: 'القادمة', en: 'Upcoming', count: upcomingCount },
              { key: 'completed' as const, ar: 'المكتملة', en: 'Completed', count: sessions.filter((s: any) => completedStatuses.includes(s.status)).length },
              { key: 'cancelled' as const, ar: 'الملغاة', en: 'Cancelled', count: sessions.filter((s: any) => cancelledStatuses.includes(s.status)).length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: activeTab === tab.key ? '#5120c8' : subtext, borderBottom: `2px solid ${activeTab === tab.key ? '#5120c8' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s' }}>
                {isAr ? tab.ar : tab.en}
                {tab.count > 0 && <span style={{ padding: '1px 5px', borderRadius: 10, fontSize: 9, fontWeight: 800, background: activeTab === tab.key ? '#5120c8' : 'rgba(107,114,128,0.15)', color: activeTab === tab.key ? '#ffffff' : subtext }}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '22px 24px 80px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 180, borderRadius: 16, animation: 'pulse 1.5s infinite', background: isDark ? '#1a1a1a' : '#f4f4f8' }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
            </div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 24px' }}>
            <Calendar size={44} color={subtext} style={{ marginBottom: 14, opacity: 0.4 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{isAr ? 'لا توجد جلسات' : 'No sessions found'}</h3>
            <p style={{ color: subtext, fontSize: 13, marginBottom: 20 }}>
              {activeTab === 'upcoming'
                ? (isAr ? 'احجز جلستك الأولى' : 'Book your first session')
                : (isAr ? 'لا توجد جلسات هنا' : 'No sessions here')}
            </p>
            {activeTab === 'upcoming' && (
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{ padding: '11px 26px', borderRadius: 11, background: '#5120c8', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {isAr ? 'احجز جلسة' : 'Book a Session'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((session: any) => <SessionCard key={session.id} session={session} />)}
          </div>
        )}
      </div>

      {rescheduleModal && (
        <>
          <div onClick={() => setRescheduleModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(430px,calc(100vw - 24px))', background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', zIndex: 201, padding: '22px', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'طلب تغيير الموعد' : 'Request Reschedule'}</h3>
              <button onClick={() => setRescheduleModal(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
            </div>
            <p style={{ color: '#d97706', fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14 }}>
              {isAr ? 'سيتم إرسال إشعار للعميل للموافقة على الموعد الجديد' : 'Client will be notified to approve the new schedule'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 7, display: 'block' }}>{isAr ? 'التاريخ الجديد' : 'New Date'} *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1.5px solid ${newDate ? '#5120c8' : border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 7, display: 'block' }}>{isAr ? 'الوقت الجديد' : 'New Time'} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                  {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                    .filter(t => !newDate || newDate !== new Date().toISOString().split('T')[0] || parseInt(t) > new Date().getHours() + 1)
                    .map(t => <button key={t} onClick={() => setNewTime(t)} style={{ padding: '8px 2px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${newTime === t ? '#5120c8' : border}`, background: newTime === t ? 'rgba(81,32,200,0.08)' : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'), color: newTime === t ? '#5120c8' : subtext, fontSize: 11, fontWeight: 700 }}>{formatTimeSlot(t, isAr)}</button>)}
                </div>
              </div>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 7, display: 'block' }}>{isAr ? 'السبب (اختياري)' : 'Reason (optional)'}</label>
                <input type="text" placeholder={isAr ? 'مثال: ارتباط طارئ...' : 'e.g. Emergency...'} value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1px solid ${border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setRescheduleModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 12, fontWeight: 600 }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button disabled={!newDate || !newTime || requestRescheduleMutation.isPending}
                  onClick={() => requestRescheduleMutation.mutate({ id: rescheduleModal.id, proposedAt: localDateTimeToISO(newDate, newTime), reason: rescheduleReason })}
                  style={{ flex: 2, padding: '11px', borderRadius: 10, background: '#5120c8', color: '#ffffff', border: 'none', cursor: (!newDate || !newTime) ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: (!newDate || !newTime || requestRescheduleMutation.isPending) ? 0.5 : 1 }}>
                  {requestRescheduleMutation.isPending ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال الطلب' : 'Send Request')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {linkModal && (
        <>
          <div onClick={() => setLinkModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(430px,calc(100vw - 24px))', background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', zIndex: 201, padding: '22px', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'إضافة رابط الاجتماع' : 'Add Meeting Link'}</h3>
              <button onClick={() => setLinkModal(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
            </div>
            <p style={{ color: subtext, fontSize: 12, marginBottom: 12 }}>{isAr ? 'يُقبل فقط روابط Zoom أو Google Meet' : 'Only Zoom or Google Meet links accepted'}</p>
            <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
              {[{ label: 'Zoom', check: (v: string) => v.includes('zoom.us'), color: '#2D8CFF' }, { label: 'Google Meet', check: (v: string) => v.includes('meet.google.com'), color: '#00897B' }].map(m => (
                <div key={m.label} style={{ flex: 1, padding: '9px', borderRadius: 9, textAlign: 'center', border: `1.5px solid ${m.check(linkValue) ? m.color : border}`, background: m.check(linkValue) ? `${m.color}15` : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'), transition: 'all 0.15s' }}>
                  <span style={{ color: m.check(linkValue) ? m.color : subtext, fontSize: 11, fontWeight: 700 }}>{m.label}</span>
                </div>
              ))}
            </div>
            <input type="url" placeholder="https://zoom.us/j/... or https://meet.google.com/..." value={linkValue} onChange={e => setLinkValue(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', borderRadius: 9, boxSizing: 'border-box', border: `1.5px solid ${linkValue ? (linkValue.includes('zoom.us') || linkValue.includes('meet.google.com') ? '#16a34a' : '#dc2626') : border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 12, outline: 'none', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setLinkModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${border}`, background: 'transparent', color: subtext, fontSize: 12, fontWeight: 600 }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button disabled={!linkValue || (!linkValue.includes('zoom.us') && !linkValue.includes('meet.google.com')) || addLinkMutation.isPending}
                onClick={() => addLinkMutation.mutate({ id: linkModal.id, link: linkValue })}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#5120c8', color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: (!linkValue || (!linkValue.includes('zoom.us') && !linkValue.includes('meet.google.com'))) ? 'not-allowed' : 'pointer', opacity: (!linkValue || (!linkValue.includes('zoom.us') && !linkValue.includes('meet.google.com')) || addLinkMutation.isPending) ? 0.5 : 1 }}>
                {addLinkMutation.isPending ? (isAr ? 'جاري الإضافة...' : 'Adding...') : (isAr ? 'إضافة الرابط' : 'Add Link')}
              </button>
            </div>
          </div>
        </>
      )}

      {paymentSession && (
        <PaymentModal
          session={paymentSession}
          isDark={isDark}
          isAr={isAr}
          onClose={() => setPaymentSession(null)}
          onSuccess={() => {
            setPaymentSession(null)
            toast.success(isAr ? 'تمالدفع بنجاح!' : 'Payment successful!')
            qc.invalidateQueries({ queryKey: ['my-sessions'] })
          }}
          cardBg={cardBg}
          border={border}
          text={text}
          subtext={subtext}
        />
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.destructive
          ? (isAr ? 'تأكيد' : 'Confirm')
          : (isAr ? 'تأكيد' : 'Confirm')}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        confirmDestructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}