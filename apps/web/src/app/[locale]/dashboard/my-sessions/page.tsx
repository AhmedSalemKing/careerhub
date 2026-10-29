'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import { formatMoney } from '@/lib/market'
import ConfirmModal from '@/components/ConfirmModal'
import toast from 'react-hot-toast'
import { formatDate, formatTimeOnly } from '@/lib/time'

function parseSessionDate(raw: unknown): Date | null {
  if (!raw) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'string') { const d = new Date(raw); return isNaN(d.getTime()) ? null : d }
  if (typeof raw === 'object' && (raw as any).$date) { const d = new Date((raw as any).$date); return isNaN(d.getTime()) ? null : d }
  return null
}

const Ic = {
  user: (p: { size?: number; color?: string }) => (
    <svg width={p.size??19} height={p.size??19} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  calendar: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  clock: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  video: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  ),
  check: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
  ),
  xCircle: (p: { size?: number; color?: string }) => (
    <svg width={p.size??11} height={p.size??11} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  ),
  plus: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  refresh: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  ),
  creditCard: (p: { size?: number; color?: string }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  ),
  dollar: (p: { size?: number; color?: string }) => (
    <svg width={p.size??10} height={p.size??10} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  alert: (p: { size?: number; color?: string }) => (
    <svg width={p.size??14} height={p.size??14} viewBox="0 0 24 24" fill="none" stroke={p.color??'currentColor'} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
}

const STATUS_CONFIG: Record<string, any> = {
  PENDING:              { ar: 'بانتظار موافقة المستشار', en: 'Pending Approval',   color: 'var(--warning)',  bg: 'var(--warning-subtle)' },
  PENDING_APPROVAL:     { ar: 'بانتظار موافقة المستشار', en: 'Pending Approval',   color: 'var(--warning)',  bg: 'var(--warning-subtle)' },
  AWAITING_PAYMENT:     { ar: 'بانتظار الدفع',           en: 'Awaiting Payment',   color: 'var(--warning)',  bg: 'var(--warning-subtle)' },
  CONFIRMED:            { ar: 'مؤكدة',                   en: 'Confirmed',          color: 'var(--primary)', bg: 'var(--primary-subtle)' },
  IN_PROGRESS:          { ar: 'جارية',                   en: 'In Progress',        color: 'var(--success)', bg: 'var(--success-subtle)' },
  COMPLETED:            { ar: 'مكتملة',                  en: 'Completed',          color: 'var(--muted)',   bg: 'var(--surface-2)' },
  CANCELLED:            { ar: 'ملغاة',                   en: 'Cancelled',          color: 'var(--error)',   bg: 'var(--error-subtle)' },
  RESCHEDULE_REQUESTED: { ar: 'تغيير موعد',              en: 'Reschedule Pending', color: 'var(--accent)',  bg: 'var(--accent-light)' },
}

type TabKey = 'upcoming' | 'pending' | 'completed' | 'cancelled'

const TABS: { key: TabKey; ar: string; en: string; statuses: string[] }[] = [
  { key: 'upcoming',  ar: 'القادمة',          en: 'Upcoming',         statuses: ['CONFIRMED', 'IN_PROGRESS'] },
  { key: 'pending',   ar: 'انتظار الموافقة',  en: 'Pending Approval', statuses: ['PENDING', 'PENDING_APPROVAL', 'AWAITING_PAYMENT', 'RESCHEDULE_REQUESTED'] },
  { key: 'completed', ar: 'المكتملة',         en: 'Completed',        statuses: ['COMPLETED'] },
  { key: 'cancelled', ar: 'الملغاة',          en: 'Cancelled',        statuses: ['CANCELLED'] },
]

export default function MySessionsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const qc = useQueryClient()

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    onConfirm: () => void; destructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')
  const [payingId, setPayingId] = useState<string | null>(null)

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

  const filtered = mySessions.filter((s: any) => TABS.find(t => t.key === activeTab)?.statuses.includes(s.status))

  const approveRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/approve-reschedule`, {}),
    onSuccess: () => { toast.success(isAr ? 'تمت الموافقة على الموعد الجديد' : 'New time approved'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const rejectRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/reject-reschedule`, {}),
    onSuccess: () => { toast.success(isAr ? 'تم رفض تغيير الموعد' : 'Reschedule rejected'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/cancel`, {}),
    onSuccess: () => { toast.success(isAr ? 'تم إلغاء الجلسة' : 'Session cancelled'); qc.invalidateQueries({ queryKey: ['my-sessions'] }) }
  })

  const paySession = async (sessionId: string, price: number) => {
    setPayingId(sessionId)
    try {
      const res = await post(`/payments/checkout/consulting/${sessionId}`, { locale })
      const payload = res?.data?.data ?? res?.data ?? res
      const checkoutUrl = payload?.checkoutUrl || payload?.url
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      }
      toast.success(isAr ? 'تم الدفع بنجاح!' : 'Payment successful!')
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
    } catch(e: any) {
      toast.error(e.message || (isAr ? 'خطأ في الدفع' : 'Payment error'))
    } finally {
      setPayingId(null)
    }
  }

  const isSoon = (d: unknown) => {
    const parsed = parseSessionDate(d)
    if (!parsed) return false
    const diff = parsed.getTime() - Date.now()
    return diff > 0 && diff < 3600000
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '26px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Ic.user size={19} />
              </div>
              <div>
                <h1 style={{ color: 'var(--foreground)', fontSize: 19, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                  {isAr ? 'جلساتي الاستشارية' : 'My Consulting Sessions'}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 11, margin: 0 }}>
                  {isAr ? `${mySessions.length} جلسة إجمالاً` : `${mySessions.length} total sessions`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Ic.refresh size={12} />{isAr ? 'تحديث' : 'Refresh'}
              </button>
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                <Ic.plus size={12} />{isAr ? 'جلسة جديدة' : 'New Session'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { val: mySessions.filter((s: any) => ['CONFIRMED','IN_PROGRESS'].includes(s.status)).length, ar: 'جلساتي القادمة', en: 'My Upcoming', color: 'var(--primary)', background: 'var(--primary-subtle)' },
              { val: mySessions.filter((s: any) => s.status === 'COMPLETED').length, ar: 'مكتملة', en: 'Completed', color: 'var(--muted)', background: 'var(--surface-2)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', background: s.background, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.color, fontSize: 18, fontWeight: 300 }}>{s.val}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{isAr ? s.ar : s.en}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex' }}>
            {TABS.map(tab => {
              const count = mySessions.filter((s: any) => tab.statuses.includes(s.status)).length
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted)', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s' }}>
                  {isAr ? tab.ar : tab.en}
                  {count > 0 && <span style={{ padding: '1px 5px', borderRadius: 10, fontSize: 9, fontWeight: 300, background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface-2)', color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--muted)' }}>{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '22px 24px 80px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 180, borderRadius: 16, animation: 'pulse 1.5s infinite', background: 'var(--surface)' }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
            </div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 24px' }}>
            <span style={{ color: 'var(--muted)', opacity: 0.4, display: 'block', marginBottom: 14 }}><Ic.calendar size={44} /></span>
            <h3 style={{ color: 'var(--foreground)', fontSize: 18, fontWeight: 500, margin: '0 0 8px' }}>{isAr ? 'لا توجد جلسات' : 'No sessions found'}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              {activeTab === 'upcoming' ? (isAr ? 'احجز جلستك الأولى' : 'Book your first session') : (isAr ? 'لا توجد جلسات هنا' : 'No sessions here')}
            </p>
            {activeTab === 'upcoming' && (
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{ padding: '11px 26px', borderRadius: 11, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                {isAr ? 'احجز جلسة' : 'Book a Session'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((session: any) => {
              const conf = STATUS_CONFIG[session.status] || STATUS_CONFIG.PENDING_APPROVAL
              const soon = isSoon(session.scheduledAt)
              const isRescheduleReq = session.status === 'RESCHEDULE_REQUESTED'
              const isPaid = session.paymentStatus === 'PAID'
              const consultant = session.consultant
              const consultantName = `${consultant?.profile?.firstName || ''} ${consultant?.profile?.lastName || ''}`.trim() || ''

              return (
                <div key={session.id} style={{
                  background: 'var(--card)', borderRadius: 18,
                  border: `1.5px solid ${soon ? 'var(--primary-border)' : (isRescheduleReq ? 'var(--accent)' : 'var(--border)')}`,
                  overflow: 'hidden',
                  boxShadow: soon ? '0 0 0 4px var(--primary-subtle)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {soon && !isRescheduleReq && (
                    <div style={{ padding: '8px 20px', background: 'var(--primary-subtle)', borderBottom: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Ic.video size={13} color="var(--primary)" />
                      <span style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 500 }}>
                        {isAr ? 'الجلسة ستبدأ خلال أقل من ساعة' : 'Session starts in less than 1 hour'}
                      </span>
                    </div>
                  )}

                  {isRescheduleReq && (
                    <div style={{ padding: '10px 20px', background: 'var(--accent-light)', borderBottom: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Ic.alert size={14} color="var(--accent)" />
                      <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500, flex: 1 }}>
                        {isAr ? 'المستشار اقترح موعداً جديداً — هل توافق؟' : 'Consultant proposed a new time — do you approve?'}
                        {session.proposedAt && (
                          <span style={{ marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0, color: 'var(--primary)', fontWeight: 300 }}>
                            {' '}{formatDate(session.proposedAt, locale)} {formatTimeOnly(session.proposedAt)}
                          </span>
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => approveRescheduleMutation.mutate(session.id)} disabled={approveRescheduleMutation.isPending} style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          {isAr ? 'موافقة' : 'Approve'}
                        </button>
                        <button onClick={() => rejectRescheduleMutation.mutate(session.id)} disabled={rejectRescheduleMutation.isPending} style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--error)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {consultant?.profile?.avatar
                          ? <img src={consultant.profile.avatar} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 16, fontWeight: 500, flexShrink: 0 }}>{consultantName?.[0] || '?'}</div>}
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 300, marginBottom: 1 }}>
                            {isAr ? 'المستشار' : 'Consultant'}
                          </div>
                          <div style={{ color: 'var(--foreground)', fontSize: 15, fontWeight: 500 }}>{consultantName}</div>
                          {consultant?.profile?.speciality && (
                            <div style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 300 }}>{consultant.profile.speciality}</div>
                          )}
                          {session.sessionName && (
                            <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
                              {isAr ? 'الجلسة: ' : 'Session: '}<span style={{ color: 'var(--foreground)', fontWeight: 300 }}>{session.sessionName}</span>
                            </div>
                          )}
                          {session.topic && (
                            <div style={{ color: 'var(--muted)', fontSize: 11 }}>
                              {isAr ? 'الموضوع: ' : 'Topic: '}{session.topic}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ padding: '4px 10px', borderRadius: 20, background: conf.bg, border: `1px solid ${conf.color}`, color: conf.color, fontSize: 11, fontWeight: 300 }}>
                          {isAr ? conf.ar : conf.en}
                        </div>
                        {session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
                          <div style={{ padding: '4px 10px', borderRadius: 20, background: isPaid ? 'var(--success-subtle)' : 'var(--warning-subtle)', border: `1px solid ${isPaid ? 'var(--success)' : 'var(--warning)'}`, color: isPaid ? 'var(--success)' : 'var(--warning)', fontSize: 11, fontWeight: 300, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Ic.dollar size={10} />
                            {isPaid ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.calendar size={12} color="var(--muted)" />
                        <span style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 300 }}>{formatDate(session.scheduledAt, locale)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.clock size={12} color="var(--muted)" />
                        <span style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 300 }}>{formatTimeOnly(session.scheduledAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ic.video size={12} color="var(--muted)" />
                        <span style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 300 }}>Daily.co</span>
                      </div>
                      {session.duration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Ic.clock size={12} color="var(--muted)" />
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{session.duration} {isAr ? 'دقيقة' : 'min'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {session.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => router.push(`/${locale}/dashboard/consulting/${session.id}/go-live`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'var(--success)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          {isAr ? 'انضم للجلسة الآن' : 'Join Session Now'}
                        </button>
                      )}

                      {session.status === 'AWAITING_PAYMENT' && (session.price || 0) > 0 && (
                        <button onClick={() => paySession(session.id, session.price)}
                          disabled={payingId === session.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', cursor: payingId === session.id ? 'wait' : 'pointer', fontSize: 12, fontWeight: 500, opacity: payingId === session.id ? 0.7 : 1 }}>
                          <Ic.creditCard size={12} />{payingId === session.id ? (isAr ? 'جاري الدفع...' : 'Processing...') : (isAr ? `ادفع ${formatMoney(session.price, (session as any).priceDisplay)}` : `Pay ${formatMoney(session.price, (session as any).priceDisplay)}`)}
                        </button>
                      )}

                      {session.status === 'AWAITING_PAYMENT' && !(session.price || 0) && (
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
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          <Ic.check size={12} />
                          {isAr ? 'تأكيد الجلسة المجانية' : 'Confirm Free Session'}
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
                              cancelMutation.mutate(session.id)
                            },
                          })
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--error)', background: 'var(--error-subtle)', color: 'var(--error)', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                          <Ic.xCircle size={11} />{isAr ? 'إلغاء' : 'Cancel'}
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
