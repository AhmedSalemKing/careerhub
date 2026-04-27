'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch } from '@/lib/api'
import {
  Calendar, Clock, Video, CheckCircle2, XCircle,
  ExternalLink, Plus, RefreshCw, Link2, X,
  Copy, Check, CreditCard, DollarSign,
  AlertTriangle, User, Briefcase, MessageSquare
} from 'lucide-react'

const STATUS_CONFIG: Record<string, any> = {
  PENDING:              { ar:'قيد الانتظار',       en:'Pending',            color:'#d97706', bg:'rgba(245,158,11,0.1)' },
  CONFIRMED:            { ar:'مؤكدة',              en:'Confirmed',          color:'#5120c8', bg:'rgba(81,32,200,0.1)' },
  SCHEDULED:            { ar:'مجدولة',             en:'Scheduled',          color:'#0ea5e9', bg:'rgba(14,165,233,0.1)' },
  COMPLETED:            { ar:'مكتملة',             en:'Completed',          color:'#16a34a', bg:'rgba(22,163,74,0.1)' },
  EXPIRED:              { ar:'منتهية',             en:'Expired',            color:'#6b7280', bg:'rgba(107,114,128,0.1)' },
  CANCELLED:            { ar:'ملغاة',              en:'Cancelled',          color:'#dc2626', bg:'rgba(220,38,38,0.1)' },
  NO_SHOW:              { ar:'لم يحضر',            en:'No Show',            color:'#dc2626', bg:'rgba(220,38,38,0.08)' },
  RESCHEDULE_REQUESTED: { ar:'طلب تغيير موعد',     en:'Reschedule Pending', color:'#7c3aed', bg:'rgba(124,58,237,0.1)' },
}

export default function DashboardCoachingPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const qc = useQueryClient()

  const [activeTab, setActiveTab] = useState<'upcoming'|'completed'|'cancelled'>('upcoming')
  const [rescheduleModal, setRescheduleModal] = useState<any>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [linkModal, setLinkModal] = useState<any>(null)
  const [linkValue, setLinkValue] = useState('')
  const [copied, setCopied] = useState('')

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await get('/users/me')
      return res.data?.data ?? res.data
    }
  })

  const isConsultantRole = me?.accountType === 'CONSULTANT' || me?.role === 'INSTRUCTOR'

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['consulting-sessions'],
    queryFn: async () => {
      const res = await get('/coaching/consulting/my-sessions')
      const arr = res.data?.data ?? res.data ?? []
      return Array.isArray(arr) ? arr : []
    },
    refetchInterval: 30000,
  })

  const payMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/pay`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['consulting-sessions'] }) },
    onError: () => {}
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/complete`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['consulting-sessions'] }) }
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/cancel`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['consulting-sessions'] }) }
  })

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, date, time, reason }: any) =>
      patch(`/consulting/sessions/${id}/request-reschedule`, { proposedDate: date, proposedTime: time, reason }),
    onSuccess: () => {
      setRescheduleModal(null)
      qc.invalidateQueries({ queryKey:['consulting-sessions'] })
    }
  })

  const approveRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/approve-reschedule`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['consulting-sessions'] }) }
  })

  const rejectRescheduleMutation = useMutation({
    mutationFn: (id: string) => patch(`/consulting/sessions/${id}/reject-reschedule`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['consulting-sessions'] }) }
  })

  const addLinkMutation = useMutation({
    mutationFn: ({ id, link }: any) => {
      const type = link.includes('zoom.us') ? 'zoom' : link.includes('meet.google.com') ? 'meet' : 'zoom'
      return patch(`/consulting/sessions/${id}/meeting-link`, { meetingLink: link, meetingType: type })
    },
    onSuccess: () => {
      setLinkModal(null)
      setLinkValue('')
      qc.invalidateQueries({ queryKey:['consulting-sessions'] })
    }
  })

  const upcomingStatuses = ['PENDING','CONFIRMED','SCHEDULED','RESCHEDULE_REQUESTED']
  const completedStatuses = ['COMPLETED','NO_SHOW']
  const cancelledStatuses = ['CANCELLED','EXPIRED']

  const filtered = sessions.filter((s: any) => {
    if (activeTab==='upcoming') return upcomingStatuses.includes(s.status)
    if (activeTab==='completed') return completedStatuses.includes(s.status)
    return cancelledStatuses.includes(s.status)
  })

  const upcomingCount = sessions.filter((s: any) => upcomingStatuses.includes(s.status)).length
  const rescheduleRequests = sessions.filter((s: any) => s.status === 'RESCHEDULE_REQUESTED').length

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(isAr?'ar-EG':'en-US', { weekday:'short', year:'numeric', month:'long', day:'numeric' }) }
    catch { return d }
  }
  const formatTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString(isAr?'ar-EG':'en-US', { hour:'2-digit', minute:'2-digit' }) }
    catch { return '' }
  }
  const isSoon = (d: string) => new Date(d).getTime() - Date.now() < 3600000 && new Date(d).getTime() > Date.now()

  const getProposedTime = (notes: string) => {
    const match = notes?.match(/\[RESCHEDULE_PROPOSED:([^:\]]+)/)
    if (match) {
      try { return new Date(match[1]) } catch { return null }
    }
    return null
  }
  const getProposedReason = (notes: string) => {
    const match = notes?.match(/\[RESCHEDULE_PROPOSED:[^:]+:([^\]]+)\]/)
    return match?.[1] || ''
  }

  return (
    <div style={{ minHeight:'100vh', background:bg, direction:isAr?'rtl':'ltr' }}>
      
      <div style={{ padding:'28px 24px 0', borderBottom:`1px solid ${border}`, background:cardBg }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{
                width:44, height:44, borderRadius:12,
                background:'rgba(81,32,200,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {isConsultantRole
                  ? <Briefcase size={20} color="#5120c8" />
                  : <User size={20} color="#5120c8" />}
              </div>
              <div>
                <h1 style={{ color:text, fontSize:20, fontWeight:900, margin:'0 0 2px', letterSpacing:'-0.02em' }}>
                  {isConsultantRole
                    ? (isAr?'استشاراتي':'My Consultations')
                    : (isAr?'جلساتي':'My Sessions')}
                </h1>
                <p style={{ color:subtext, fontSize:12, margin:0 }}>
                  {isAr ? `${sessions.length} جلسة إجمالاً` : `${sessions.length} total sessions`}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => refetch()} style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'9px 14px', borderRadius:10,
                border:`1px solid ${border}`, background:'transparent',
                color:subtext, cursor:'pointer', fontSize:12, fontWeight:600,
              }}>
                <RefreshCw size={12} />
                {isAr?'تحديث':'Refresh'}
              </button>
              {!isConsultantRole && (
                <button onClick={() => router.push(`/${locale}/coaching`)} style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'9px 16px', borderRadius:10,
                  background:'#5120c8', color:'#ffffff',
                  border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                }}>
                  <Plus size={13} />
                  {isAr?'احجز جلسة':'Book Session'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { val:upcomingCount, ar:'قادمة', en:'Upcoming', color:'#5120c8', bg:'rgba(81,32,200,0.08)' },
              { val:sessions.filter((s:any)=>s.status==='COMPLETED').length, ar:'مكتملة', en:'Completed', color:'#16a34a', bg:'rgba(22,163,74,0.08)' },
              ...(rescheduleRequests > 0 ? [{ val:rescheduleRequests, ar:'طلبات تغيير', en:'Reschedule Req', color:'#7c3aed', bg:'rgba(124,58,237,0.08)' }] : []),
              ...(!isConsultantRole ? [{ val:sessions.filter((s:any)=>s.paymentStatus==='UNPAID'&&upcomingStatuses.includes(s.status)).length, ar:'غير مدفوعة', en:'Unpaid', color:'#d97706', bg:'rgba(245,158,11,0.08)' }] : []),
            ].map((s,i) => (
              <div key={i} style={{
                padding:'10px 16px', borderRadius:10,
                border:`1px solid ${border}`,
                background:isDark?'rgba(255,255,255,0.03)':s.bg,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <span style={{ color:s.color, fontSize:20, fontWeight:900 }}>{s.val}</span>
                <span style={{ color:subtext, fontSize:12 }}>{isAr?s.ar:s.en}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex' }}>
            {[
              { key:'upcoming', ar:'القادمة', en:'Upcoming', count:upcomingCount },
              { key:'completed', ar:'المكتملة', en:'Completed', count:sessions.filter((s:any)=>completedStatuses.includes(s.status)).length },
              { key:'cancelled', ar:'الملغاة', en:'Cancelled/Expired', count:sessions.filter((s:any)=>cancelledStatuses.includes(s.status)).length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'12px 18px', background:'none', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700,
                color:activeTab===tab.key?'#5120c8':subtext,
                borderBottom:`2px solid ${activeTab===tab.key?'#5120c8':'transparent'}`,
                marginBottom:-1, transition:'all 0.15s',
              }}>
                {isAr?tab.ar:tab.en}
                {tab.count > 0 && (
                  <span style={{
                    padding:'1px 7px', borderRadius:10, fontSize:10, fontWeight:800,
                    background:activeTab===tab.key?'#5120c8':'rgba(107,114,128,0.15)',
                    color:activeTab===tab.key?'#ffffff':subtext,
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px' }}>
        {isLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height:200, borderRadius:16, animation:'pulse 1.5s infinite', background:isDark?'#1a1a1a':'#f4f4f8' }}>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <Calendar size={48} color={subtext} style={{ marginBottom:16, opacity:0.5 }} />
            <h3 style={{ color:text, fontSize:20, fontWeight:800, margin:'0 0 8px' }}>
              {isAr?'لا توجد جلسات':'No sessions found'}
            </h3>
            <p style={{ color:subtext, fontSize:14, margin:'0 0 24px' }}>
              {activeTab==='upcoming'
                ? (isConsultantRole
                    ? (isAr?'لا توجد استشارات قادمة':'No upcoming consultations')
                    : (isAr?'احجز جلستك الأولى مع أحد مستشارينا':'Book your first session'))
                : (isAr?'لا توجد جلسات في هذا القسم':'No sessions here')}
            </p>
            {activeTab==='upcoming' && !isConsultantRole && (
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{
                padding:'12px 28px', borderRadius:12,
                background:'#5120c8', color:'#ffffff',
                border:'none', cursor:'pointer', fontSize:14, fontWeight:700,
              }}>
                {isAr?'احجز جلسة الآن':'Book a Session Now'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filtered.map((session: any) => {
              const conf = STATUS_CONFIG[session.status] || STATUS_CONFIG.PENDING
              const soon = isSoon(session.scheduledAt)
              const amIConsultant = isConsultantRole && me?.id === session.consultantId
              const amIUser = !isConsultantRole || me?.id === session.studentId
              const other = amIConsultant ? session.student : session.consultant
              const otherName = `${other?.profile?.firstName||''} ${other?.profile?.lastName||''}`.trim() || (isAr?'مستخدم':'User')
              const isPaid = session.paymentStatus === 'PAID'
              const isUpcoming = upcomingStatuses.includes(session.status)
              const isRescheduleRequested = session.status === 'RESCHEDULE_REQUESTED'
              const proposedTime = isRescheduleRequested ? getProposedTime(session.notes) : null
              const proposedReason = isRescheduleRequested ? getProposedReason(session.notes) : ''

              return (
                <div key={session.id} style={{
                  background:cardBg, borderRadius:18,
                  border:`1.5px solid ${soon?'rgba(81,32,200,0.5)':isRescheduleRequested?'rgba(124,58,237,0.4)':border}`,
                  overflow:'hidden',
                  boxShadow:soon?'0 0 0 4px rgba(81,32,200,0.06)':isRescheduleRequested?'0 0 0 4px rgba(124,58,237,0.06)':'none',
                }}>
                  
                  {soon && !isRescheduleRequested && (
                    <div style={{ padding:'8px 20px', background:'rgba(81,32,200,0.1)', borderBottom:'1px solid rgba(81,32,200,0.15)', display:'flex', alignItems:'center', gap:8 }}>
                      <Video size={13} color="#5120c8" />
                      <span style={{ color:'#5120c8', fontSize:12, fontWeight:700 }}>
                        {isAr?'الجلسة ستبدأ خلال أقل من ساعة!':'Session starts in less than 1 hour!'}
                      </span>
                    </div>
                  )}
                  
                  {isRescheduleRequested && (
                    <div style={{ padding:'10px 20px', background:'rgba(124,58,237,0.08)', borderBottom:'1px solid rgba(124,58,237,0.15)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <AlertTriangle size={14} color="#7c3aed" />
                      <div style={{ flex:1 }}>
                        <span style={{ color:'#7c3aed', fontSize:12, fontWeight:700 }}>
                          {amIConsultant
                            ? (isAr?'طلبت تغيير الموعد في انتظار موافقة':'Awaiting reschedule approval')
                            : (isAr?'المستشار طلب تغيير الموعد':'Consultant requested reschedule')}
                        </span>
                        {proposedTime && (
                          <span style={{ color:'#7c3aed', fontSize:12, marginRight:8 }}>
                            {isAr?'الموعد المقترح:':'Proposed:'} {formatDate(proposedTime.toISOString())} {formatTime(proposedTime.toISOString())}
                          </span>
                        )}
                      </div>
                      
                      {amIUser && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            onClick={() => approveRescheduleMutation.mutate(session.id)}
                            disabled={approveRescheduleMutation.isPending}
                            style={{
                              padding:'6px 14px', borderRadius:8,
                              background:'#16a34a', color:'#ffffff',
                              border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                            }}>
                            {isAr?'موافقة':'Approve'}
                          </button>
                          <button
                            onClick={() => rejectRescheduleMutation.mutate(session.id)}
                            disabled={rejectRescheduleMutation.isPending}
                            style={{
                              padding:'6px 14px', borderRadius:8,
                              background:'#dc2626', color:'#ffffff',
                              border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                            }}>
                            {isAr?'رفض':'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding:'22px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        {other?.profile?.avatar ? (
                          <img src={other.profile.avatar} alt="" style={{ width:50, height:50, borderRadius:14, objectFit:'cover', flexShrink:0 }} />
                        ) : (
                          <div style={{ width:50, height:50, borderRadius:14, background:'rgba(81,32,200,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#5120c8', fontSize:18, fontWeight:800, flexShrink:0 }}>
                            {otherName?.[0]||'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ color:subtext, fontSize:11, fontWeight:600, marginBottom:2 }}>
                            {amIConsultant?(isAr?'العميل':'Client'):(isAr?'المستشار':'Consultant')}
                          </div>
                          <div style={{ color:text, fontSize:16, fontWeight:800, marginBottom:1 }}>{otherName}</div>
                          {!amIConsultant && other?.profile?.speciality && (
                            <div style={{ color:'#5120c8', fontSize:12, fontWeight:600 }}>{other.profile.speciality}</div>
                          )}
                          {session.topic && (
                            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                              <MessageSquare size={11} color={subtext} />
                              <span style={{ color:subtext, fontSize:12 }}>{session.topic}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'flex-start' }}>
                        <div style={{ padding:'5px 12px', borderRadius:20, background:conf.bg, border:`1px solid ${conf.color}30`, color:conf.color, fontSize:12, fontWeight:700 }}>
                          {isAr?conf.ar:conf.en}
                        </div>
                        {isUpcoming && (
                          <div style={{
                            padding:'5px 12px', borderRadius:20,
                            background:isPaid?'rgba(22,163,74,0.1)':'rgba(245,158,11,0.1)',
                            border:`1px solid ${isPaid?'rgba(22,163,74,0.2)':'rgba(245,158,11,0.2)'}`,
                            color:isPaid?'#16a34a':'#d97706', fontSize:12, fontWeight:700,
                            display:'flex', alignItems:'center', gap:4,
                          }}>
                            <DollarSign size={10} />
                            {isPaid?(isAr?'مدفوعة':'Paid'):(isAr?'غير مدفوعة':'Unpaid')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      display:'flex', gap:16, flexWrap:'wrap', padding:'12px 14px',
                      borderRadius:10, background:isDark?'rgba(255,255,255,0.03)':'#fafafa',
                      border:`1px solid ${border}`, marginBottom:14,
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Calendar size={13} color={subtext} />
                        <span style={{ color:text, fontSize:13, fontWeight:600 }}>{formatDate(session.scheduledAt)}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Clock size={13} color={subtext} />
                        <span style={{ color:text, fontSize:13, fontWeight:600 }}>{formatTime(session.scheduledAt)}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Video size={13} color={subtext} />
                        <span style={{ color:text, fontSize:13, fontWeight:600 }}>
                          {session.meetingMethod==='zoom'?'Zoom':'Google Meet'}
                        </span>
                      </div>
                      {session.duration && (
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <Clock size={13} color={subtext} />
                          <span style={{ color:subtext, fontSize:12 }}>{session.duration} {isAr?'دقيقة':'min'}</span>
                        </div>
                      )}
                    </div>

                    {session.meetingLink && (
                      <div style={{
                        padding:'10px 14px', borderRadius:10, marginBottom:14,
                        background:'rgba(81,32,200,0.06)', border:'1px solid rgba(81,32,200,0.2)',
                        display:'flex', alignItems:'center', gap:10,
                      }}>
                        <Link2 size={13} color="#5120c8" />
                        <span style={{ color:'#5120c8', fontSize:12, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.meetingLink}
                        </span>
                        <button onClick={() => { navigator.clipboard.writeText(session.meetingLink); setCopied(session.id); setTimeout(()=>setCopied(''),2000) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#5120c8', flexShrink:0 }}>
                          {copied===session.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                        </button>
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8,
                          background:'#5120c8', color:'#ffffff', textDecoration:'none', fontSize:12, fontWeight:700, flexShrink:0,
                        }}>
                          <ExternalLink size={11} />
                          {isAr?'انضم':'Join'}
                        </a>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      
                      {session.meetingLink && isUpcoming && (
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10,
                          background:'#5120c8', color:'#ffffff', textDecoration:'none', fontSize:13, fontWeight:700,
                        }}>
                          <Video size={13} />
                          {isAr?'انضم للجلسة':'Join Session'}
                        </a>
                      )}

                      {amIUser && !isPaid && isUpcoming && !isRescheduleRequested && (
                        <button
                          onClick={() => payMutation.mutate(session.id)}
                          disabled={payMutation.isPending}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10,
                            background:'#16a34a', color:'#ffffff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                            opacity:payMutation.isPending?0.7:1,
                          }}>
                          <CreditCard size={13} />
                          {isAr?'ادفع الآن':'Pay Now'}
                        </button>
                      )}

                      {isPaid && isUpcoming && session.status !== 'COMPLETED' && !isRescheduleRequested && (
                        <button
                          onClick={() => completeMutation.mutate(session.id)}
                          disabled={completeMutation.isPending}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10,
                            background:'rgba(22,163,74,0.1)', color:'#16a34a',
                            border:'1px solid rgba(22,163,74,0.3)', cursor:'pointer', fontSize:13, fontWeight:700,
                            opacity:completeMutation.isPending?0.7:1,
                          }}>
                          <CheckCircle2 size={13} />
                          {isAr?'أكمل الجلسة':'Mark Complete'}
                        </button>
                      )}

                      {amIConsultant && isUpcoming && !isRescheduleRequested && (
                        <button onClick={() => { setRescheduleModal(session); setNewDate(''); setNewTime(''); setRescheduleReason('') }} style={{
                          display:'flex', alignItems:'center', gap:6, padding:'10px 16px', borderRadius:10,
                          border:`1px solid ${border}`, background:'transparent',
                          color:subtext, cursor:'pointer', fontSize:12, fontWeight:600,
                        }}>
                          <RefreshCw size={12} />
                          {isAr?'طلب تغيير الموعد':'Request Reschedule'}
                        </button>
                      )}

                      {amIConsultant && isPaid && !session.meetingLink && isUpcoming && (
                        <button onClick={() => { setLinkModal(session); setLinkValue('') }} style={{
                          display:'flex', alignItems:'center', gap:6, padding:'10px 16px', borderRadius:10,
                          border:'1px solid rgba(81,32,200,0.3)', background:'rgba(81,32,200,0.06)',
                          color:'#5120c8', cursor:'pointer', fontSize:12, fontWeight:700,
                        }}>
                          <Link2 size={12} />
                          {isAr?'إضافة رابط':'Add Link'}
                        </button>
                      )}

                      {isUpcoming && !isPaid && !isRescheduleRequested && (
                        <button onClick={() => cancelMutation.mutate(session.id)} style={{
                          display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderRadius:10,
                          border:'1px solid rgba(220,38,38,0.2)', background:'rgba(220,38,38,0.04)',
                          color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:600,
                        }}>
                          <XCircle size={12} />
                          {isAr?'إلغاء':'Cancel'}
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
          <div onClick={() => setRescheduleModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:200, backdropFilter:'blur(4px)' }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'min(460px,calc(100vw-32px))', background:cardBg, borderRadius:20,
            border:`1px solid ${border}`, boxShadow:'0 24px 64px rgba(0,0,0,0.4)', zIndex:201,
            padding:'24px', direction:isAr?'rtl':'ltr',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:text, fontSize:16, fontWeight:800, margin:0 }}>
                {isAr?'طلب تغيير الموعد':'Request Reschedule'}
              </h3>
              <button onClick={() => setRescheduleModal(null)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:subtext }}>
                <X size={15} />
              </button>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ color:text, fontSize:13, fontWeight:700, marginBottom:8, display:'block' }}>{isAr?'التاريخ الجديد':'New Date'} *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${newDate?'#5120c8':border}`, background:isDark?'#0d0d0d':'#fafafa', color:text, fontSize:14, outline:'none' }} />
              </div>
              <div>
                <label style={{ color:text, fontSize:13, fontWeight:700, marginBottom:8, display:'block' }}>{isAr?'الوقت الجديد':'New Time'} *</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                    .filter(t => !newDate || newDate !== new Date().toISOString().split('T')[0] || parseInt(t.split(':')[0]) > new Date().getHours()+1)
                    .map(t => (
                      <button key={t} onClick={() => setNewTime(t)} style={{
                        padding:'9px 4px', borderRadius:8, cursor:'pointer',
                        border:`1.5px solid ${newTime===t?'#5120c8':border}`,
                        background:newTime===t?'rgba(81,32,200,0.08)':(isDark?'rgba(255,255,255,0.03)':'#fafafa'),
                        color:newTime===t?'#5120c8':subtext, fontSize:11, fontWeight:700,
                      }}>{t}</button>
                    ))}
                </div>
              </div>
              <div>
                <label style={{ color:text, fontSize:13, fontWeight:700, marginBottom:8, display:'block' }}>{isAr?'سبب التغيير (اختياري)':'Reason (optional)'}</label>
                <input type="text" value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${border}`, background:isDark?'#0d0d0d':'#fafafa', color:text, fontSize:13, outline:'none' }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setRescheduleModal(null)} style={{ flex:1, padding:'12px', borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:subtext, fontSize:13, fontWeight:600 }}>
                  {isAr?'إلغاء':'Cancel'}
                </button>
                <button
                  disabled={!newDate||!newTime||requestRescheduleMutation.isPending}
                  onClick={() => requestRescheduleMutation.mutate({ id:rescheduleModal.id, date:newDate, time:newTime, reason:rescheduleReason })}
                  style={{
                    flex:2, padding:'12px', borderRadius:10, border:'none', cursor:(!newDate||!newTime)?'not-allowed':'pointer',
                    background:'#5120c8', color:'#ffffff', fontSize:13, fontWeight:700,
                    opacity:(!newDate||!newTime||requestRescheduleMutation.isPending)?0.5:1,
                  }}>
                  {isAr?'إرسال الطلب':'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {linkModal && (
        <>
          <div onClick={() => setLinkModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:200 }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'min(440px,calc(100vw-32px))', background:cardBg, borderRadius:20,
            border:`1px solid ${border}`, boxShadow:'0 24px 64px rgba(0,0,0,0.4)', zIndex:201,
            padding:'24px', direction:isAr?'rtl':'ltr',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ color:text, fontSize:16, fontWeight:800, margin:0 }}>{isAr?'إضافة رابط الاجتماع':'Add Meeting Link'}</h3>
              <button onClick={() => setLinkModal(null)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${border}`, background:'transparent', cursor:'pointer', color:subtext }}>
                <X size={15} />
              </button>
            </div>
            
            <input type="url" placeholder="https://zoom.us/j/... or https://meet.google.com/..." value={linkValue} onChange={e => setLinkValue(e.target.value)}
              style={{
                width:'100%', padding:'12px 14px', borderRadius:10, boxSizing:'border-box',
                border:`1.5px solid ${linkValue?(linkValue.includes('zoom.us')||linkValue.includes('meet.google.com')?'#16a34a':'#dc2626'):border}`,
                background:isDark?'#0d0d0d':'#fafafa', color:text, fontSize:14, outline:'none', marginBottom: linkValue && !linkValue.includes('zoom.us') && !linkValue.includes('meet.google.com') ? 6 : 16,
              }}
            />
            {linkValue && !linkValue.includes('zoom.us') && !linkValue.includes('meet.google.com') && (
              <p style={{ color:'#dc2626', fontSize:12, marginBottom:14 }}>{isAr?'رابط غير صالح':'Invalid link'}</p>
            )}
            
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setLinkModal(null)} style={{ flex:1, padding:'12px', borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:subtext, fontSize:13, fontWeight:600 }}>
                {isAr?'إلغاء':'Cancel'}
              </button>
              <button
                disabled={!linkValue||(!linkValue.includes('zoom.us')&&!linkValue.includes('meet.google.com'))||addLinkMutation.isPending}
                onClick={() => addLinkMutation.mutate({ id:linkModal.id, link:linkValue })}
                style={{
                  flex:2, padding:'12px', borderRadius:10, border:'none',
                  background:'#5120c8', color:'#ffffff', fontSize:13, fontWeight:700,
                  cursor:(!linkValue||(!linkValue.includes('zoom.us')&&!linkValue.includes('meet.google.com')))?'not-allowed':'pointer',
                  opacity:(!linkValue||(!linkValue.includes('zoom.us')&&!linkValue.includes('meet.google.com'))||addLinkMutation.isPending)?0.5:1,
                }}>
                  {addLinkMutation.isPending?(isAr?'جاري...':'...'):(isAr?'إضافة الرابط':'Add Link')}
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}