'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import {
  Calendar, Clock, Video, CheckCircle2, XCircle,
  ExternalLink, RefreshCw, X, DollarSign,
  AlertTriangle, Users, Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { formatDate, formatTimeOnly, localDateTimeToISO } from '@/lib/time'

const STATUS_CONFIG: Record<string, any> = {
  PENDING:              { ar: 'بانتظار الموافقة', en: 'Pending Approval',   color: '#FFC107', bg: 'rgba(255,193,7,0.12)' },
  PENDING_APPROVAL:     { ar: 'بانتظار الموافقة', en: 'Pending Approval',   color: '#FFC107', bg: 'rgba(255,193,7,0.12)' },
  AWAITING_PAYMENT:     { ar: 'بانتظار الدفع',    en: 'Awaiting Payment',   color: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  CONFIRMED:            { ar: 'مؤكدة',             en: 'Confirmed',          color: '#1B4F72', bg: 'rgba(27,79,114,0.12)' },
  IN_PROGRESS:          { ar: 'جارية',             en: 'In Progress',        color: '#27AE60', bg: 'rgba(39,174,96,0.12)' },
  COMPLETED:            { ar: 'مكتملة',            en: 'Completed',          color: '#95A5A6', bg: 'rgba(149,165,166,0.12)' },
  CANCELLED:            { ar: 'ملغاة',             en: 'Cancelled',          color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' },
  RESCHEDULE_REQUESTED: { ar: 'تغيير موعد',        en: 'Reschedule Pending', color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
}

type TabKey = 'pending_approval' | 'awaiting_payment' | 'upcoming' | 'completed' | 'cancelled'

const TABS: { key: TabKey; ar: string; en: string; statuses: string[] }[] = [
  { key: 'pending_approval', ar: 'بانتظار موافقتي', en: 'Pending Approval', statuses: ['PENDING', 'PENDING_APPROVAL'] },
  { key: 'awaiting_payment', ar: 'انتظار الدفع',    en: 'Awaiting Payment', statuses: ['AWAITING_PAYMENT'] },
  { key: 'upcoming',         ar: 'القادمة',          en: 'Upcoming',         statuses: ['CONFIRMED', 'IN_PROGRESS', 'RESCHEDULE_REQUESTED'] },
  { key: 'completed',        ar: 'المكتملة',         en: 'Completed',        statuses: ['COMPLETED'] },
  { key: 'cancelled',        ar: 'الملغاة',          en: 'Cancelled',        statuses: ['CANCELLED'] },
]

export default function ClientSessionsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabKey>('pending_approval')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [startLoadingId, setStartLoadingId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; destructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [rescheduleModal, setRescheduleModal] = useState<any>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['client-sessions'],
    queryFn: async () => {
      const r = await get('/consulting/sessions')
      return r.data?.data?.clientSessions ?? []
    },
    refetchInterval: 30000,
  })

  const sessions: any[] = sessionsData ?? []

  const filtered = sessions.filter((s: any) => TABS.find(t => t.key === activeTab)?.statuses.includes(s.status))

  const handleApprove = async (sessionId: string) => {
    try {
      setLoadingId(sessionId)
      await patch(`/consulting/sessions/${sessionId}/approve`, {})
      toast.success(isAr ? 'تمت الموافقة على الجلسة' : 'Session approved')
      qc.invalidateQueries({ queryKey: ['client-sessions'] })
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (sessionId: string) => {
    try {
      setLoadingId(sessionId)
      await patch(`/consulting/sessions/${sessionId}/cancel`, {})
      toast.success(isAr ? 'تم رفض الجلسة' : 'Session rejected')
      qc.invalidateQueries({ queryKey: ['client-sessions'] })
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setLoadingId(null)
    }
  }

  const startRoomMutation = useMutation({
    mutationFn: (id: string) => post(`/consulting/sessions/${id}/start-room`, {}),
    onSuccess: (res: any) => {
      const roomUrl = res?.data?.data?.roomUrl
      if (roomUrl) window.open(roomUrl, '_blank')
      toast.success(isAr ? 'تم بدء الجلسة' : 'Session started')
      qc.invalidateQueries({ queryKey: ['client-sessions'] })
    },
    onError: (e: any) => toast.error(e?.message || (isAr ? 'فشل بدء الجلسة' : 'Failed to start session')),
  })

  const joinRoomMutation = useMutation({
    mutationFn: (id: string) => post(`/consulting/sessions/${id}/join-room`, {}),
    onSuccess: (res: any) => {
      const roomUrl = res?.data?.data?.roomUrl
      if (roomUrl) window.open(roomUrl, '_blank')
    },
    onError: (e: any) => toast.error(e?.message || (isAr ? 'فشل الانضمام' : 'Failed to join')),
  })

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, proposedAt, reason }: any) =>
      patch(`/consulting/sessions/${id}/request-reschedule`, { proposedAt, reason }),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال طلب تغيير الموعد' : 'Reschedule request sent')
      setRescheduleModal(null)
      qc.invalidateQueries({ queryKey: ['client-sessions'] })
    },
    onError: (e: any) => toast.error(e?.message || (isAr ? 'حدث خطأ' : 'Error'))
  })

  const isSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 3600000
  }

  const formatTimeSlot = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const formatted = `${hour12}:${m.toString().padStart(2, '0')} ${period}`
    return isAr ? formatted.replace('AM', 'ص').replace('PM', 'م') : formatted
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '26px 24px 0', borderBottom: `1px solid ${border}`, background: cardBg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(27,79,114,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={19} color="#1B4F72" />
              </div>
              <div>
                <h1 style={{ color: text, fontSize: 19, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                  {isAr ? 'جلسات عملائي' : 'Client Sessions'}
                </h1>
                <p style={{ color: subtext, fontSize: 11, margin: 0 }}>
                  {isAr ? `${sessions.length} جلسة من العملاء` : `${sessions.length} sessions from clients`}
                </p>
              </div>
            </div>
            <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: subtext, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={12} />{isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { val: sessions.filter((s: any) => ['PENDING','PENDING_APPROVAL'].includes(s.status)).length, ar: 'بانتظار الموافقة', en: 'Pending Approval', color: '#FFC107', bg: 'rgba(255,193,7,0.08)' },
              { val: sessions.filter((s: any) => s.status === 'AWAITING_PAYMENT').length, ar: 'بانتظار الدفع', en: 'Awaiting Payment', color: '#FF9800', bg: 'rgba(255,152,0,0.08)' },
              { val: sessions.filter((s: any) => ['CONFIRMED','IN_PROGRESS'].includes(s.status)).length, ar: 'قادمة', en: 'Upcoming', color: '#1B4F72', bg: 'rgba(27,79,114,0.08)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : s.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.color, fontSize: 18, fontWeight: 900 }}>{s.val}</span>
                <span style={{ color: subtext, fontSize: 11 }}>{isAr ? s.ar : s.en}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex' }}>
            {TABS.map(tab => {
              const count = sessions.filter((s: any) => tab.statuses.includes(s.status)).length
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: activeTab === tab.key ? '#1B4F72' : subtext, borderBottom: `2px solid ${activeTab === tab.key ? '#1B4F72' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s' }}>
                  {isAr ? tab.ar : tab.en}
                  {count > 0 && <span style={{ padding: '1px 5px', borderRadius: 10, fontSize: 9, fontWeight: 800, background: activeTab === tab.key ? '#1B4F72' : 'rgba(107,114,128,0.15)', color: activeTab === tab.key ? '#ffffff' : subtext }}>{count}</span>}
                </button>
              )
            })}
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
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Users size={48} color={subtext} style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
              {isAr ? 'لا توجد جلسات هنا' : 'No sessions here'}
            </h3>
            <p style={{ color: subtext, fontSize: 13 }}>
              {isAr ? 'ستظهر هنا الجلسات التي يحجزها العملاء معك' : 'Sessions booked with you by clients will appear here'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((session: any) => {
              const conf = STATUS_CONFIG[session.status] || STATUS_CONFIG.PENDING_APPROVAL
              const soon = isSoon(session.scheduledAt)
              const isPaid = session.paymentStatus === 'PAID'
              const isRescheduleReq = session.status === 'RESCHEDULE_REQUESTED'
              const client = session.user
              const clientName = `${client?.profile?.firstName || ''} ${client?.profile?.lastName || ''}`.trim() || ''

              return (
                <div key={session.id} style={{
                  background: cardBg, borderRadius: 18,
                  border: `1.5px solid ${soon ? 'rgba(27,79,114,0.5)' : isRescheduleReq ? 'rgba(155,89,182,0.4)' : border}`,
                  overflow: 'hidden', transition: 'all 0.2s',
                  boxShadow: soon ? '0 0 0 4px rgba(27,79,114,0.06)' : 'none',
                }}>
                  {soon && (
                    <div style={{ padding: '8px 20px', background: 'rgba(27,79,114,0.1)', borderBottom: '1px solid rgba(27,79,114,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Video size={13} color="#1B4F72" />
                      <span style={{ color: '#1B4F72', fontSize: 12, fontWeight: 700 }}>
                        {isAr ? 'الجلسة ستبدأ خلال أقل من ساعة' : 'Session starts in less than 1 hour'}
                      </span>
                    </div>
                  )}

                  {isRescheduleReq && (
                    <div style={{ padding: '8px 20px', background: 'rgba(155,89,182,0.08)', borderBottom: '1px solid rgba(155,89,182,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={13} color="#9B59B6" />
                      <span style={{ color: '#9B59B6', fontSize: 12, fontWeight: 700 }}>
                        {isAr ? 'في انتظار موافقة العميل على الموعد الجديد' : 'Awaiting client approval for new schedule'}
                        {session.proposedAt && <span style={{ marginRight: isAr ? 8 : 0, marginLeft: isAr ? 0 : 8, color: '#1B4F72' }}> {formatDate(session.proposedAt, locale)} {formatTimeOnly(session.proposedAt)}</span>}
                      </span>
                    </div>
                  )}

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {client?.profile?.avatar
                          ? <img src={client.profile.avatar} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(27,79,114,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B4F72', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{clientName?.[0] || '?'}</div>}
                        <div>
                          <div style={{ color: subtext, fontSize: 11, fontWeight: 600, marginBottom: 1 }}>{isAr ? 'العميل' : 'Client'}</div>
                          <div style={{ color: text, fontSize: 15, fontWeight: 800 }}>{clientName}</div>
                          {session.sessionName && (
                            <div style={{ color: subtext, fontSize: 11, marginTop: 2 }}>
                              <span style={{ color: text, fontWeight: 600 }}>{session.sessionName}</span>
                            </div>
                          )}
                          {session.topic && <div style={{ color: subtext, fontSize: 11 }}>{isAr ? 'الموضوع: ' : 'Topic: '}{session.topic}</div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ padding: '4px 10px', borderRadius: 20, background: conf.bg, border: `1px solid ${conf.color}30`, color: conf.color, fontSize: 11, fontWeight: 700 }}>
                          {isAr ? conf.ar : conf.en}
                        </div>
                        {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
                          <div style={{ padding: '4px 10px', borderRadius: 20, background: isPaid ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isPaid ? 'rgba(22,163,74,0.2)' : 'rgba(245,158,11,0.2)'}`, color: isPaid ? '#16a34a' : '#d97706', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <DollarSign size={10} />
                            {isPaid ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', border: `1px solid ${border}`, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} color={subtext} /><span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{formatDate(session.scheduledAt, locale)}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} color={subtext} /><span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{formatTimeOnly(session.scheduledAt)}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Video size={12} color={subtext} /><span style={{ color: text, fontSize: 12, fontWeight: 600 }}>Daily.co</span></div>
                      {session.duration && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} color={subtext} /><span style={{ color: subtext, fontSize: 12 }}>{session.duration} {isAr ? 'دقيقة' : 'min'}</span></div>}
                    </div>

                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {session.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => handleApprove(session.id)} disabled={loadingId === session.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'rgba(22,163,74,0.15)', color: 'rgb(22,163,74)', border: '1px solid rgba(22,163,74,0.4)', cursor: loadingId === session.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: loadingId === session.id ? 0.5 : 1 }}>
                            <CheckCircle2 size={12} />{isAr ? 'الموافقة على الجلسة' : 'Approve Session'}
                          </button>
                          <button onClick={() => handleReject(session.id)} disabled={loadingId === session.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', cursor: loadingId === session.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: loadingId === session.id ? 0.5 : 1 }}>
                            <X size={12} />{isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}

                      {session.status === 'CONFIRMED' && (
                        <button
                          onClick={() => startRoomMutation.mutate(session.id)}
                          disabled={startLoadingId === session.id || startRoomMutation.isPending}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: '#27AE60', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: startRoomMutation.isPending ? 0.7 : 1 }}
                        >
                          <Play size={12} />{isAr ? 'بدء الجلسة' : 'Start Session'}
                        </button>
                      )}

                      {session.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => joinRoomMutation.mutate(session.id)}
                          disabled={joinRoomMutation.isPending}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: '#1B4F72', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: joinRoomMutation.isPending ? 0.7 : 1 }}
                        >
                          <ExternalLink size={12} />{isAr ? 'انضم للجلسة' : 'Join Session'}
                        </button>
                      )}

                      {['PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED','RESCHEDULE_REQUESTED'].includes(session.status) && (
                        <button onClick={() => { setRescheduleModal(session); setNewDate(''); setNewTime(''); setRescheduleReason('') }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: subtext, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          <Clock size={11} />{isAr ? 'تغيير الموعد' : 'Reschedule'}
                        </button>
                      )}

                      {['PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED','RESCHEDULE_REQUESTED'].includes(session.status) && (
                        <button onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: isAr ? 'إلغاء الجلسة' : 'Cancel Session',
                            message: isAr ? 'هل أنت متأكد من إلغاء هذه الجلسة؟' : 'Are you sure you want to cancel this session?',
                            destructive: true,
                            onConfirm: () => {
                              setConfirmModal(prev => ({ ...prev, isOpen: false }))
                              handleReject(session.id)
                            },
                          })
                        }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.04)', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                          <XCircle size={11} />{isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rescheduleModal && (
        <>
          <div onClick={() => setRescheduleModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(420px,calc(100vw - 24px))', background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', zIndex: 201, padding: '22px', direction: isAr ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'طلب تغيير الموعد' : 'Request Reschedule'}</h3>
              <button onClick={() => setRescheduleModal(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}><X size={14} /></button>
            </div>
            <p style={{ color: '#d97706', fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14 }}>
              {isAr ? 'سيتم إرسال إشعار للعميل للموافقة' : 'Client will be notified to approve'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 7, display: 'block' }}>{isAr ? 'التاريخ الجديد' : 'New Date'} *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '11px 13px', borderRadius: 9, border: `1.5px solid ${newDate ? '#1B4F72' : border}`, background: isDark ? '#0d0d0d' : '#fafafa', color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 7, display: 'block' }}>{isAr ? 'الوقت الجديد' : 'New Time'} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                  {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                    .filter(t => !newDate || newDate !== new Date().toISOString().split('T')[0] || parseInt(t) > new Date().getHours() + 1)
                    .map(t => <button key={t} onClick={() => setNewTime(t)} style={{ padding: '8px 2px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${newTime === t ? '#1B4F72' : border}`, background: newTime === t ? 'rgba(27,79,114,0.08)' : (isDark ? 'rgba(255,255,255,0.03)' : '#fafafa'), color: newTime === t ? '#1B4F72' : subtext, fontSize: 11, fontWeight: 700 }}>{formatTimeSlot(t)}</button>)}
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
                  style={{ flex: 2, padding: '11px', borderRadius: 10, background: '#1B4F72', color: '#ffffff', border: 'none', cursor: (!newDate || !newTime) ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: (!newDate || !newTime || requestRescheduleMutation.isPending) ? 0.5 : 1 }}>
                  {requestRescheduleMutation.isPending ? (isAr ? 'جاري...' : 'Sending...') : (isAr ? 'إرسال الطلب' : 'Send Request')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={isAr ? 'تأكيد' : 'Confirm'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        confirmDestructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
