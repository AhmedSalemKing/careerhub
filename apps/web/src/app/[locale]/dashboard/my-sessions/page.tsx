'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import {
  Calendar, Clock, Video, CheckCircle2, XCircle, AlertCircle,
  ExternalLink, Plus, RefreshCw, Link2, X, Copy, Check,
  CreditCard, DollarSign
} from 'lucide-react'

type SessionStatus = 'PENDING'|'CONFIRMED'|'SCHEDULED'|'COMPLETED'|'EXPIRED'|'CANCELLED'|'NO_SHOW'

const STATUS_CONFIG: Record<string, { labelAr:string, labelEn:string, color:string, bg:string }> = {
  PENDING:   { labelAr:'قيد الانتظار', labelEn:'Pending',   color:'#d97706', bg:'rgba(245,158,11,0.1)' },
  CONFIRMED: { labelAr:'مؤكدة',        labelEn:'Confirmed', color:'#5120c8', bg:'rgba(81,32,200,0.1)'  },
  SCHEDULED: { labelAr:'مجدولة',       labelEn:'Scheduled', color:'#0ea5e9', bg:'rgba(14,165,233,0.1)' },
  COMPLETED: { labelAr:'مكتملة',       labelEn:'Completed', color:'#16a34a', bg:'rgba(22,163,74,0.1)'  },
  EXPIRED:   { labelAr:'منتهية',       labelEn:'Expired',   color:'#6b7280', bg:'rgba(107,114,128,0.1)'},
  CANCELLED: { labelAr:'ملغاة',        labelEn:'Cancelled', color:'#dc2626', bg:'rgba(220,38,38,0.1)'  },
  NO_SHOW:   { labelAr:'لم يحضر',      labelEn:'No Show',   color:'#dc2626', bg:'rgba(220,38,38,0.08)' },
}

export default function MySessionsPage() {
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

  const { data: sessionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const res = await get('/sessions/my-sessions')
      const arr = res.data?.data ?? res.data ?? []
      return Array.isArray(arr) ? arr : []
    },
    refetchInterval: 30000,
  })

  const payMutation = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/confirm`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['my-sessions'] })
    },
    onError: () => {}
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/complete`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['my-sessions'] }) }
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/status`, { status:'CANCELLED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['my-sessions'] }) }
  })

  const addLinkMutation = useMutation({
    mutationFn: ({ id, link, type }: { id:string, link:string, type:string }) => 
      patch(`/sessions/${id}/meeting-link`, { meetingLink: link, meetingType: type }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['my-sessions'] }) }
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id:string, scheduledAt:string }) =>
      patch(`/sessions/${id}/reschedule`, { proposedTime: scheduledAt }),
    onSuccess: () => {
      setRescheduleModal(null)
      qc.invalidateQueries({ queryKey:['my-sessions'] })
    }
  })

  const upcomingStatuses = ['PENDING','CONFIRMED','SCHEDULED']
  const completedStatuses = ['COMPLETED','NO_SHOW']
  const cancelledStatuses = ['CANCELLED','EXPIRED']

  const filtered = sessionsData.filter((s: any) => {
    if (activeTab==='upcoming') return upcomingStatuses.includes(s.status)
    if (activeTab==='completed') return completedStatuses.includes(s.status)
    return cancelledStatuses.includes(s.status)
  })

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(isAr?'ar-EG':'en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) }
    catch { return d }
  }
  const formatTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString(isAr?'ar-EG':'en-US', { hour:'2-digit', minute:'2-digit' }) }
    catch { return '' }
  }
  const isSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 3600000
  }
  const isConsultant = (s: any) => me?.id === s.consultantId
  const isUser = (s: any) => me?.id === s.studentId

  return (
    <div style={{ minHeight:'100vh', background:bg, direction:isAr?'rtl':'ltr' }}>
      
      <div style={{ padding:'28px 24px 0', borderBottom:`1px solid ${border}`, background:cardBg }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ color:text, fontSize:22, fontWeight:900, margin:'0 0 4px', letterSpacing:'-0.02em' }}>
                {isAr ? 'جلساتي الاستشارية' : 'My Consulting Sessions'}
              </h1>
              <p style={{ color:subtext, fontSize:13, margin:0 }}>
                {isAr ? `${sessionsData.length} جلسة إجمالاً` : `${sessionsData.length} sessions total`}
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => refetch()} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 16px', borderRadius:10,
                border:`1px solid ${border}`, background:'transparent',
                color:subtext, cursor:'pointer', fontSize:13, fontWeight:600,
              }}>
                <RefreshCw size={13} />
                {isAr?'تحديث':'Refresh'}
              </button>
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 18px', borderRadius:10,
                background:'#5120c8', color:'#ffffff',
                border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
              }}>
                <Plus size={13} />
                {isAr?'جلسة جديدة':'New Session'}
              </button>
            </div>
          </div>
          
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { val:sessionsData.filter((s:any)=>upcomingStatuses.includes(s.status)).length, labelAr:'قادمة', labelEn:'Upcoming', color:'#5120c8' },
              { val:sessionsData.filter((s:any)=>s.status==='COMPLETED').length, labelAr:'مكتملة', labelEn:'Completed', color:'#16a34a' },
              { val:sessionsData.filter((s:any)=>s.paymentStatus==='UNPAID'&&upcomingStatuses.includes(s.status)).length, labelAr:'غير مدفوعة', labelEn:'Unpaid', color:'#d97706' },
            ].map((stat,i) => (
              <div key={i} style={{
                padding:'12px 18px', borderRadius:12,
                border:`1px solid ${border}`, background:cardBg,
                display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{ color:stat.color, fontSize:22, fontWeight:900 }}>{stat.val}</span>
                <span style={{ color:subtext, fontSize:12 }}>{isAr?stat.labelAr:stat.labelEn}</span>
              </div>
            ))}
          </div>
          
          <div style={{ display:'flex' }}>
            {[
              { key:'upcoming', ar:'القادمة', en:'Upcoming', count:sessionsData.filter((s:any)=>upcomingStatuses.includes(s.status)).length },
              { key:'completed', ar:'المكتملة', en:'Completed', count:sessionsData.filter((s:any)=>completedStatuses.includes(s.status)).length },
              { key:'cancelled', ar:'الملغاة', en:'Cancelled', count:sessionsData.filter((s:any)=>cancelledStatuses.includes(s.status)).length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700,
                color:activeTab===tab.key?'#5120c8':subtext,
                borderBottom:`2px solid ${activeTab===tab.key?'#5120c8':'transparent'}`,
                marginBottom:-1, transition:'all 0.15s',
              }}>
                {isAr?tab.ar:tab.en}
                {tab.count > 0 && (
                  <span style={{
                    padding:'1px 6px', borderRadius:10, fontSize:10, fontWeight:800,
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
              <div key={i} style={{ height:180, borderRadius:16, background:isDark?'#1a1a1a':'#f4f4f8' }}>
                <div style={{ width:'100%', height:'100%', animation:'pulse 1.5s infinite', background:isDark?'#222':'#efefef', borderRadius:16 }} />
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <Calendar size={48} color={subtext} style={{ marginBottom:16 }} />
            <h3 style={{ color:text, fontSize:20, fontWeight:800, margin:'0 0 8px' }}>
              {isAr?'لا توجد جلسات':'No sessions found'}
            </h3>
            <p style={{ color:subtext, fontSize:14, margin:'0 0 24px' }}>
              {activeTab==='upcoming'?(isAr?'احجز جلستك الأولى مع أحد مستشارينا':'Book your first session with one of our consultants'):(isAr?'لا توجد جلسات في هذا القسم':'No sessions in this section')}
            </p>
            {activeTab==='upcoming' && (
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
              const amConsultant = isConsultant(session)
              const amUser = isUser(session)
              const other = amConsultant ? session.student : session.consultant
              const otherName = `${other?.profile?.firstName||''} ${other?.profile?.lastName||''}`.trim()
              const isPaid = session.paymentStatus === 'PAID'
              const isUpcoming = upcomingStatuses.includes(session.status)

              return (
                <div key={session.id} style={{
                  background:cardBg, borderRadius:18,
                  border:`1.5px solid ${soon?'rgba(81,32,200,0.4)':border}`,
                  overflow:'hidden',
                  boxShadow:soon?'0 0 0 4px rgba(81,32,200,0.06)':'none',
                  transition:'all 0.2s',
                }}>
                  
                  {soon && (
                    <div style={{
                      padding:'8px 20px', background:'rgba(81,32,200,0.1)',
                      borderBottom:'1px solid rgba(81,32,200,0.15)',
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <Video size={13} color="#5120c8" />
                      <span style={{ color:'#5120c8', fontSize:12, fontWeight:700 }}>
                        {isAr?'الجلسة ستبدأ خلال أقل من ساعة!':'Session starts in less than 1 hour!'}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ padding:'22px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:16 }}>
                      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        {other?.profile?.avatar ? (
                          <img src={other.profile.avatar} alt="" style={{ width:48, height:48, borderRadius:14, objectFit:'cover' }} />
                        ) : (
                          <div style={{
                            width:48, height:48, borderRadius:14,
                            background:'rgba(81,32,200,0.1)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#5120c8', fontSize:18, fontWeight:800,
                          }}>
                            {otherName?.[0]||'C'}
                          </div>
                        )}
                        <div>
                          <div style={{ color:subtext, fontSize:11, fontWeight:600, marginBottom:2 }}>
                            {amConsultant ? (isAr?'الطالب':'Student') : (isAr?'المستشار':'Consultant')}
                          </div>
                          <div style={{ color:text, fontSize:16, fontWeight:800 }}>{otherName}</div>
                          {!amConsultant && other?.profile?.speciality && (
                            <div style={{ color:'#5120c8', fontSize:12, fontWeight:600 }}>{other.profile.speciality}</div>
                          )}
                          {session.topic && (
                            <div style={{ color:subtext, fontSize:12, marginTop:2 }}>
                              {isAr?'الهدف: ':'Goal: '}{session.topic}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <div style={{
                          padding:'5px 12px', borderRadius:20,
                          background:conf.bg, border:`1px solid ${conf.color}30`,
                          color:conf.color, fontSize:12, fontWeight:700,
                        }}>
                          {isAr?conf.labelAr:conf.labelEn}
                        </div>
                        {isUpcoming && (
                          <div style={{
                            padding:'5px 12px', borderRadius:20,
                            background:isPaid?'rgba(22,163,74,0.1)':'rgba(245,158,11,0.1)',
                            border:`1px solid ${isPaid?'rgba(22,163,74,0.2)':'rgba(245,158,11,0.2)'}`,
                            color:isPaid?'#16a34a':'#d97706',
                            fontSize:12, fontWeight:700,
                            display:'flex', alignItems:'center', gap:4,
                          }}>
                            <DollarSign size={11} />
                            {isPaid?(isAr?'مدفوعة':'Paid'):(isAr?'غير مدفوعة':'Unpaid')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      display:'flex', gap:16, flexWrap:'wrap',
                      padding:'12px 14px', borderRadius:10,
                      background:isDark?'rgba(255,255,255,0.03)':'#fafafa',
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
                          <span style={{ color:subtext, fontSize:13 }}>{session.duration} {isAr?'دقيقة':'min'}</span>
                        </div>
                      )}
                    </div>
                    
                    {session.meetingLink && (
                      <div style={{
                        padding:'10px 14px', borderRadius:10, marginBottom:14,
                        background:'rgba(81,32,200,0.06)',
                        border:'1px solid rgba(81,32,200,0.2)',
                        display:'flex', alignItems:'center', gap:10,
                      }}>
                        <Link2 size={13} color="#5120c8" />
                        <span style={{ color:'#5120c8', fontSize:12, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.meetingLink}
                        </span>
                        <button onClick={() => { navigator.clipboard.writeText(session.meetingLink); setCopied(session.id); setTimeout(()=>setCopied(''),2000) }} style={{
                          background:'none', border:'none', cursor:'pointer', color:'#5120c8', display:'flex', flexShrink:0,
                        }}>
                          {copied===session.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                        </button>
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:4, flexShrink:0,
                          padding:'5px 12px', borderRadius:8,
                          background:'#5120c8', color:'#ffffff',
                          textDecoration:'none', fontSize:12, fontWeight:700,
                        }}>
                          <ExternalLink size={11} />
                          {isAr?'انضم':'Join'}
                        </a>
                      </div>
                    )}
                    
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      
                      {session.meetingLink && isUpcoming && (
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'10px 20px', borderRadius:10,
                          background:'#5120c8', color:'#ffffff',
                          textDecoration:'none', fontSize:13, fontWeight:700,
                        }}>
                          <Video size={13} />
                          {isAr?'انضم للجلسة':'Join Session'}
                        </a>
                      )}
                      
                      {amUser && !isPaid && isUpcoming && (
                        <button
                          onClick={() => payMutation.mutate(session.id)}
                          disabled={payMutation.isPending}
                          style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'10px 18px', borderRadius:10,
                            background:'#16a34a', color:'#ffffff',
                            border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                            opacity:payMutation.isPending?0.7:1,
                          }}>
                          <CreditCard size={13} />
                          {payMutation.isPending?(isAr?'جاري...':'...'):(isAr?'ادفع الآن':'Pay Now')}
                        </button>
                      )}
                      
                      {isPaid && isUpcoming && session.status !== 'COMPLETED' && (
                        <button
                          onClick={() => completeMutation.mutate(session.id)}
                          disabled={completeMutation.isPending}
                          style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'10px 18px', borderRadius:10,
                            background:'#16a34a', color:'#ffffff',
                            border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                            opacity:completeMutation.isPending?0.7:1,
                          }}>
                          <CheckCircle2 size={13} />
                          {completeMutation.isPending?(isAr?'جاري...':'...'):(isAr?'أكمل الجلسة':'Mark Complete')}
                        </button>
                      )}
                      
                      {amConsultant && isUpcoming && !session.meetingLink && (
                        <button
                          onClick={async () => {
                            const link = prompt(isAr?'أضف رابط Zoom أو Google Meet:':'Add Zoom or Google Meet link:')
                            if (!link) return
                            if (!link.includes('zoom.us') && !link.includes('meet.google.com')) {
                              alert(isAr?'يُقبل فقط روابط Zoom أو Google Meet':'Only Zoom or Google Meet links accepted')
                              return
                            }
                            const type = link.includes('zoom.us') ? 'zoom' : 'meet'
                            addLinkMutation.mutate({ id: session.id, link, type })
                          }}
                          disabled={addLinkMutation.isPending}
                          style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'10px 16px', borderRadius:10,
                            border:'1px solid rgba(81,32,200,0.3)',
                            background:'rgba(81,32,200,0.06)',
                            color:'#5120c8', cursor:'pointer', fontSize:12, fontWeight:700,
                          }}>
                          <Link2 size={12} />
                          {addLinkMutation.isPending?(isAr?'جاري...':'...'):(isAr?'إضافة رابط':'Add Link')}
                        </button>
                      )}
                      
                      {isUpcoming && !isPaid && (
                        <button
                          onClick={() => {
                            if (confirm(isAr?'هل تريد إلغاء الجلسة؟':'Cancel this session?')) {
                              cancelMutation.mutate(session.id)
                            }
                          }}
                          style={{
                            display:'flex', alignItems:'center', gap:6,
                            padding:'10px 14px', borderRadius:10,
                            border:'1px solid rgba(220,38,38,0.2)',
                            background:'rgba(220,38,38,0.04)',
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
          <div onClick={() => setRescheduleModal(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, backdropFilter:'blur(4px)',
          }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'min(420px,calc(100vw-32px))',
            background:cardBg, borderRadius:20, border:`1px solid ${border}`,
            boxShadow:'0 24px 64px rgba(0,0,0,0.4)', zIndex:201,
            padding:'24px', direction:isAr?'rtl':'ltr',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:text, fontSize:16, fontWeight:800, margin:0 }}>
                {isAr?'تغيير موعد الجلسة':'Reschedule Session'}
              </h3>
              <button onClick={() => setRescheduleModal(null)} style={{
                width:32, height:32, borderRadius:8, border:`1px solid ${border}`,
                background:'transparent', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', color:subtext,
              }}>
                <X size={15} />
              </button>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ color:text, fontSize:13, fontWeight:700, marginBottom:8, display:'block' }}>
                  {isAr?'التاريخ الجديد':'New Date'} *
                </label>
                <input type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{
                    width:'100%', padding:'12px 14px', borderRadius:10,
                    border:`1.5px solid ${newDate?'#5120c8':border}`,
                    background:isDark?'#0d0d0d':'#fafafa',
                    color:text, fontSize:14, outline:'none', boxSizing:'border-box',
                  }}
                />
              </div>
              
              <div>
                <label style={{ color:text, fontSize:13, fontWeight:700, marginBottom:8, display:'block' }}>
                  {isAr?'الوقت الجديد':'New Time'} *
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                    .filter(t => {
                      if (!newDate || newDate !== new Date().toISOString().split('T')[0]) return true
                      return parseInt(t.split(':')[0]) > new Date().getHours() + 1
                    })
                    .map(t => (
                      <button key={t} onClick={() => setNewTime(t)} style={{
                        padding:'9px 4px', borderRadius:8, cursor:'pointer',
                        border:`1.5px solid ${newTime===t?'#5120c8':border}`,
                        background:newTime===t?'rgba(81,32,200,0.08)':(isDark?'rgba(255,255,255,0.03)':'#fafafa'),
                        color:newTime===t?'#5120c8':subtext,
                        fontSize:11, fontWeight:700,
                      }}>{t}</button>
                    ))}
                </div>
              </div>
              
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setRescheduleModal(null)} style={{
                  flex:1, padding:'12px', borderRadius:10, cursor:'pointer',
                  border:`1px solid ${border}`, background:'transparent',
                  color:subtext, fontSize:13, fontWeight:600,
                }}>
                  {isAr?'إلغاء':'Cancel'}
                </button>
                <button
                  disabled={!newDate || !newTime || rescheduleMutation.isPending}
                  onClick={() => rescheduleMutation.mutate({
                    id: rescheduleModal.id,
                    scheduledAt: `${newDate}T${newTime}:00`
                  })}
                  style={{
                    flex:2, padding:'12px', borderRadius:10,
                    background:'#5120c8', color:'#ffffff', border:'none',
                    cursor:(!newDate||!newTime)?'not-allowed':'pointer',
                    fontSize:13, fontWeight:700,
                    opacity:(!newDate||!newTime||rescheduleMutation.isPending)?0.5:1,
                  }}>
                  {rescheduleMutation.isPending?(isAr?'جاري...':'...'):(isAr?'تأكيد':'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}