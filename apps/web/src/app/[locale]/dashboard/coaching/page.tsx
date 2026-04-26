'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, patch } from '../../../../lib/api'
import { useToast } from '../../../../lib/toast'
import {
  Calendar, Clock, Video, CheckCircle2, XCircle, AlertCircle,
  ExternalLink, Plus, RefreshCw, Link2, ChevronRight, User,
  X, Copy, Check
} from 'lucide-react'

type SessionStatus = 'PENDING' | 'CONFIRMED' | 'SCHEDULED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW'

const STATUS_CONFIG: Record<SessionStatus, { labelAr: string, labelEn: string, color: string, bg: string, icon: any }> = {
  PENDING:   { labelAr:'قيد الانتظار', labelEn:'Pending',   color:'#d97706', bg:'rgba(245,158,11,0.1)', icon: AlertCircle },
  CONFIRMED: { labelAr:'مؤكدة',        labelEn:'Confirmed', color:'#5120c8', bg:'rgba(81,32,200,0.1)', icon: CheckCircle2 },
  SCHEDULED: { labelAr:'مجدولة',       labelEn:'Scheduled', color:'#0ea5e9', bg:'rgba(14,165,233,0.1)', icon: Calendar },
  COMPLETED: { labelAr:'مكتملة',       labelEn:'Completed', color:'#16a34a', bg:'rgba(22,163,74,0.1)', icon: CheckCircle2 },
  EXPIRED:   { labelAr:'منتهية',       labelEn:'Expired',   color:'#6b7280', bg:'rgba(107,114,128,0.1)', icon: XCircle },
  CANCELLED: { labelAr:'ملغاة',        labelEn:'Cancelled', color:'#dc2626', bg:'rgba(220,38,38,0.1)', icon: XCircle },
  NO_SHOW:   { labelAr:'لم يحضر',      labelEn:'No Show',   color:'#dc2626', bg:'rgba(220,38,38,0.08)', icon: XCircle },
}

export default function DashboardCoachingPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'upcoming'|'completed'|'cancelled'>('upcoming')
  const [meetingLinkModal, setMeetingLinkModal] = useState<any>(null)
  const [meetingLink, setMeetingLink] = useState('')
  const [rescheduleModal, setRescheduleModal] = useState<any>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [copied, setCopied] = useState(false)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  const { data: sessionsData = [], isLoading, refetch } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const res = await get('/sessions/my-sessions')
      return (res?.data as any)?.data ?? []
    },
    refetchInterval: 30000,
  })

  const addLinkMutation = useMutation({
    mutationFn: async ({ sessionId, link }: { sessionId: string, link: string }) => {
      const isZoom = link.includes('zoom.us')
      const isMeet = link.includes('meet.google.com')
      if (!isZoom && !isMeet) {
        throw new Error(isAr ? 'يسمح فقط بروابط Zoom أو Google Meet' : 'Only Zoom or Google Meet links allowed')
      }
      return patch(`/sessions/${sessionId}/meeting-link`, {
        meetingLink: link,
        meetingType: isZoom ? 'zoom' : 'meet',
      })
    },
    onSuccess: () => {
      toast({ variant: 'success', title: isAr ? 'تم إضافة رابط الجلسة بنجاح' : 'Meeting link added successfully' })
      setMeetingLinkModal(null)
      setMeetingLink('')
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] })
    },
    onError: (e: any) => {
      toast({ variant: 'danger', title: e.message || (isAr ? 'حدث خطأ' : 'Error occurred') })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string, reason?: string }) => {
      return patch(`/sessions/${sessionId}/status`, { status: 'CANCELLED', cancelReason: reason })
    },
    onSuccess: () => {
      toast({ variant: 'success', title: isAr ? 'تم إلغاء الجلسة' : 'Session cancelled' })
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] })
    }
  })

  const rescheduleMutation = useMutation({
    mutationFn: async ({ sessionId, scheduledAt }: { sessionId: string, scheduledAt: string }) => {
      return patch(`/sessions/${sessionId}/status`, { status: 'PENDING' })
    },
    onSuccess: () => {
      toast({ variant: 'success', title: isAr ? 'تم تجديد الموعد' : 'Rescheduled successfully' })
      setRescheduleModal(null)
      queryClient.invalidateQueries({ queryKey: ['my-sessions'] })
    }
  })

  const upcomingStatuses = ['PENDING', 'CONFIRMED', 'SCHEDULED']
  const completedStatuses = ['COMPLETED', 'NO_SHOW']
  const cancelledStatuses = ['CANCELLED', 'EXPIRED']

  const filteredSessions = sessionsData.filter((s: any) => {
    if (activeTab === 'upcoming') return upcomingStatuses.includes(s.status)
    if (activeTab === 'completed') return completedStatuses.includes(s.status)
    if (activeTab === 'cancelled') return cancelledStatuses.includes(s.status)
    return true
  })

  const upcomingCount = sessionsData.filter((s: any) => upcomingStatuses.includes(s.status)).length

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    } catch { return dateStr }
  }

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return '' }
  }

  const isSessionSoon = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    return diff > 0 && diff < 60 * 60 * 1000
  }

  return (
    <div style={{ minHeight:'100vh', background:bg, direction:isAr?'rtl':'ltr' }}>
      <div style={{
        padding:'28px 24px 0',
        borderBottom:`1px solid ${border}`,
        background:cardBg,
      }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ color:text, fontSize:22, fontWeight:900, margin:'0 0 4px', letterSpacing:'-0.02em' }}>
                {isAr ? 'جلسات الكوتشينج' : 'Coaching Sessions'}
              </h1>
              <p style={{ color:subtext, fontSize:13, margin:0 }}>
                {isAr ? 'تابع جلساتك الاستشارية وأدر مواعيدك' : 'Track your consulting sessions and manage appointments'}
              </p>
            </div>
            <button
              onClick={() => router.push(`/${locale}/coaching`)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 18px', borderRadius:10,
                background:'#5120c8', color:'#ffffff',
                border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
              }}>
              <Plus size={14} />
              {isAr ? 'احجز جلسة جديدة' : 'Book New Session'}
            </button>
          </div>
          
          <div style={{ display:'flex', gap:0 }}>
            {[
              { key:'upcoming', labelAr:'القادمة', labelEn:'Upcoming', count:upcomingCount },
              { key:'completed', labelAr:'الم��تملة', labelEn:'Completed' },
              { key:'cancelled', labelAr:'الملغاة/المنتهية', labelEn:'Cancelled/Expired' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700,
                color: activeTab===tab.key ? '#5120c8' : subtext,
                borderBottom: `2px solid ${activeTab===tab.key ? '#5120c8' : 'transparent'}`,
                marginBottom:-1, transition:'all 0.15s',
              }}>
                {isAr ? tab.labelAr : tab.labelEn}
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    padding:'1px 6px', borderRadius:10, fontSize:10, fontWeight:800,
                    background:'#5120c8', color:'#ffffff',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'24px' }}>
        {isLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height:140, borderRadius:16, background:isDark?'#1a1a1a':'#f4f4f8', animation:'pulse 1.5s infinite' }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <Calendar size={40} color={subtext} style={{ marginBottom:16 }} />
            <h3 style={{ color:text, fontSize:18, fontWeight:800, margin:'0 0 8px' }}>
              {isAr ? 'لا توجد جلسات' : 'No sessions found'}
            </h3>
            <p style={{ color:subtext, fontSize:14, marginBottom:20 }}>
              {activeTab==='upcoming'
                ? (isAr?'احجز جلستك الأولى الآن':'Book your first session now')
                : (isAr?'لا توجد جلسات في هذا القسم':'No sessions in this section')}
            </p>
            {activeTab==='upcoming' && (
              <button onClick={() => router.push(`/${locale}/coaching`)} style={{
                padding:'11px 24px', borderRadius:12,
                background:'#5120c8', color:'#ffffff',
                border:'none', cursor:'pointer', fontSize:14, fontWeight:700,
              }}>
                {isAr ? 'احجز جلسة' : 'Book Session'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filteredSessions.map((session: any) => {
              const statusConf = STATUS_CONFIG[session.status as SessionStatus] || STATUS_CONFIG.PENDING
              const StatusIcon = statusConf.icon
              const isSoon = isSessionSoon(session.scheduledAt)
              const otherPerson = session.consultant || session.student
              const otherName = `${otherPerson?.profile?.firstName || ''} ${otherPerson?.profile?.lastName || ''}`.trim()

              return (
                <div key={session.id} style={{
                  background:cardBg, borderRadius:16,
                  border:`1.5px solid ${isSoon ? 'rgba(81,32,200,0.4)' : border}`,
                  overflow:'hidden',
                  boxShadow: isSoon ? '0 0 0 4px rgba(81,32,200,0.06)' : 'none',
                }}>
                  {isSoon && (
                    <div style={{
                      padding:'8px 20px',
                      background:'rgba(81,32,200,0.1)',
                      borderBottom:`1px solid rgba(81,32,200,0.15)`,
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <Video size={13} color="#5120c8" />
                      <span style={{ color:'#5120c8', fontSize:12, fontWeight:700 }}>
                        {isAr ? 'الجلسة ستبدأ خلال أقل من ساعة!' : 'Session starts in less than 1 hour!'}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ padding:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                        {otherPerson?.profile?.avatar ? (
                          <img src={otherPerson.profile.avatar} alt=""
                            style={{ width:44, height:44, borderRadius:12, objectFit:'cover', flexShrink:0 }} />
                        ) : (
                          <div style={{
                            width:44, height:44, borderRadius:12, flexShrink:0,
                            background:'rgba(81,32,200,0.1)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#5120c8', fontSize:16, fontWeight:800,
                          }}>
                            {otherName?.[0] || 'C'}
                          </div>
                        )}
                        <div>
                          <div style={{ color:text, fontSize:15, fontWeight:800, marginBottom:2 }}>
                            {otherName || (isAr?'مستشار':'Consultant')}
                          </div>
                          {otherPerson?.speciality && (
                            <div style={{ color:'#5120c8', fontSize:12, fontWeight:600, marginBottom:6 }}>
                              {otherPerson.speciality}
                            </div>
                          )}
                          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <Calendar size={12} color={subtext} />
                              <span style={{ color:subtext, fontSize:12 }}>{formatDate(session.scheduledAt)}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <Clock size={12} color={subtext} />
                              <span style={{ color:subtext, fontSize:12 }}>{formatTime(session.scheduledAt)}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <Video size={12} color={subtext} />
                              <span style={{ color:subtext, fontSize:12, textTransform:'capitalize' }}>
                                {session.meetingMethod === 'ZOOM' ? 'Zoom' : 'Google Meet'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'5px 12px', borderRadius:20,
                        background:statusConf.bg, border:`1px solid ${statusConf.color}30`,
                        flexShrink:0,
                      }}>
                        <StatusIcon size={13} color={statusConf.color} />
                        <span style={{ color:statusConf.color, fontSize:12, fontWeight:700 }}>
                          {isAr ? statusConf.labelAr : statusConf.labelEn}
                        </span>
                      </div>
                    </div>
                    
                    {session.notes && (
                      <div style={{
                        marginTop:12, padding:'10px 12px', borderRadius:8,
                        background:isDark?'rgba(255,255,255,0.03)':'#fafafa',
                        border:`1px solid ${border}`,
                        color:subtext, fontSize:12, lineHeight:1.6,
                      }}>
                        {session.notes}
                      </div>
                    )}
                    
                    {session.meetingLink && (
                      <div style={{
                        marginTop:12, padding:'10px 14px', borderRadius:10,
                        background:'rgba(81,32,200,0.06)',
                        border:'1px solid rgba(81,32,200,0.2)',
                        display:'flex', alignItems:'center', gap:10,
                      }}>
                        <Link2 size={14} color="#5120c8" />
                        <span style={{ color:'#5120c8', fontSize:12, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.meetingLink}
                        </span>
                        <button onClick={() => copyLink(session.meetingLink)} style={{
                          background:'none', border:'none', cursor:'pointer', color:'#5120c8', display:'flex', flexShrink:0,
                        }}>
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:4,
                          padding:'5px 10px', borderRadius:8,
                          background:'#5120c8', color:'#ffffff',
                          textDecoration:'none', fontSize:11, fontWeight:700, flexShrink:0,
                        }}>
                          <ExternalLink size={11} />
                          {isAr?'انضم':'Join'}
                        </a>
                      </div>
                    )}
                    
                    <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                      {session.meetingLink && upcomingStatuses.includes(session.status) && (
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'9px 18px', borderRadius:10,
                          background:'#5120c8', color:'#ffffff',
                          textDecoration:'none', fontSize:13, fontWeight:700,
                        }}>
                          <Video size={13} />
                          {isAr?'انضم للجلسة':'Join Session'}
                        </a>
                      )}
                      
                      {!session.meetingLink && ['PENDING','CONFIRMED'].includes(session.status) && (
                        <button onClick={() => { setMeetingLinkModal(session); setMeetingLink('') }} style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'9px 16px', borderRadius:10,
                          border:'1px solid rgba(81,32,200,0.3)',
                          background:'rgba(81,32,200,0.06)',
                          color:'#5120c8', cursor:'pointer', fontSize:12, fontWeight:700,
                        }}>
                          <Link2 size={12} />
                          {isAr?'إضافة رابط الاجتماع':'Add Meeting Link'}
                        </button>
                      )}
                      
                      {upcomingStatuses.includes(session.status) && (
                        <button onClick={() => {
                          if (confirm(isAr?'هل تريد إلغاء هذه الجلسة':'Cancel this session?')) {
                            cancelMutation.mutate({ sessionId: session.id })
                          }
                        }} style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'9px 14px', borderRadius:10,
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

      {meetingLinkModal && (
        <>
          <div onClick={() => setMeetingLinkModal(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, backdropFilter:'blur(4px)',
          }} />
          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width:'min(460px,calc(100vw-32px))',
            background:cardBg, borderRadius:20, border:`1px solid ${border}`,
            boxShadow:'0 24px 64px rgba(0,0,0,0.4)', zIndex:201,
            padding:'24px', direction:isAr?'rtl':'ltr',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:text, fontSize:16, fontWeight:800, margin:0 }}>
                {isAr?'إضافة رابط الاجتماع':'Add Meeting Link'}
              </h3>
              <button onClick={() => setMeetingLinkModal(null)} style={{
                width:32, height:32, borderRadius:8, border:`1px solid ${border}`,
                background:'transparent', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', color:subtext,
              }}>
                <X size={15} />
              </button>
            </div>
            
            <p style={{ color:subtext, fontSize:13, marginBottom:16 }}>
              {isAr?'يسمح فقط بروابط Zoom أو Google Meet':'Only Zoom or Google Meet links are allowed'}
            </p>
            
            <input
              type="url"
              placeholder={isAr?'https://zoom.us/j/... أو https://meet.google.com/...':'https://zoom.us/j/... or https://meet.google.com/...'}
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              style={{
                width:'100%', padding:'12px 14px', borderRadius:10,
                border:`1.5px solid ${meetingLink?(meetingLink.includes('zoom.us')||meetingLink.includes('meet.google.com')?'#16a34a':'#dc2626'):border}`,
                background:isDark?'#0d0d0d':'#fafafa',
                color:text, fontSize:14, outline:'none', boxSizing:'border-box',
                marginBottom:8,
              }}
            />
            
            {meetingLink && !meetingLink.includes('zoom.us') && !meetingLink.includes('meet.google.com') && (
              <p style={{ color:'#dc2626', fontSize:12, marginBottom:12 }}>
                {isAr?'الرابط غير صالح':'Invalid link'}
              </p>
            )}
            
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={() => setMeetingLinkModal(null)} style={{
                flex:1, padding:'12px', borderRadius:10, cursor:'pointer',
                border:`1px solid ${border}`, background:'transparent',
                color:subtext, fontSize:13, fontWeight:600,
              }}>
                {isAr?'إلغاء':'Cancel'}
              </button>
              <button
                disabled={!meetingLink || (!meetingLink.includes('zoom.us') && !meetingLink.includes('meet.google.com')) || addLinkMutation.isPending}
                onClick={() => addLinkMutation.mutate({ sessionId: meetingLinkModal.id, link: meetingLink })}
                style={{
                  flex:2, padding:'12px', borderRadius:10, cursor:'pointer',
                  background:'#5120c8', color:'#ffffff', border:'none',
                  fontSize:13, fontWeight:700,
                  opacity: (!meetingLink || (!meetingLink.includes('zoom.us') && !meetingLink.includes('meet.google.com'))) ? 0.5 : 1,
                }}>
                {addLinkMutation.isPending ? (isAr?'جاري الإضافة...':'Adding...') : (isAr?'إضافة الرابط':'Add Link')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}