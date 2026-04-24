'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { useTheme } from 'next-themes'
import { Calendar, Clock, User, Video, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function SchedulePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [view, setView] = useState<'upcoming'|'past'>('upcoming')

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['consultant-sessions', view],
    queryFn: async () => {
      const res = await get('/sessions/my-sessions')
      const all = Array.isArray(res.data?.data) ? res.data.data : []
      const now = new Date()
      if (view === 'upcoming') {
        return all.filter((s: any) => new Date(s.scheduledAt) >= now)
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      }
      return all.filter((s: any) => new Date(s.scheduledAt) < now)
        .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    }
  })

  const statusConfig: Record<string, { label: string, color: string, bg: string, icon: any }> = {
    PENDING:   { label: 'قيد الانتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: AlertCircle },
    CONFIRMED: { label: 'مؤكدة', color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: CheckCircle2 },
    COMPLETED: { label: 'مكتملة', color: '#5120c8', bg: 'rgba(81,32,200,0.1)', icon: CheckCircle2 },
    CANCELLED: { label: 'ملغية', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
  }

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0d0d0d' : '#fafafa', padding: '32px 24px 120px', direction: 'rtl' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 24, fontWeight: 800, margin: 0 }}>جدول الجلسات</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>إدارة مواعيد جلساتك الاستشارية</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'upcoming', label: 'القادمة' },
            { key: 'past', label: 'السابقة' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key as any)} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: view === tab.key ? '#5120c8' : isDark ? '#1a1a1a' : '#f1f5f9',
              color: view === tab.key ? '#fff' : isDark ? '#94a3b8' : '#6b7280',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sessions */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : !sessions?.length ? (
          <div style={{
            background: isDark ? '#121212' : '#fff', borderRadius: 20, padding: 48, textAlign: 'center',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
          }}>
            <Calendar size={48} color="#6b7280" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ color: '#6b7280' }}>لا توجد جلسات {view === 'upcoming' ? 'قادمة' : 'سابقة'}</p>
          </div>
        ) : (
          sessions.map((session: any) => {
            const status = statusConfig[session.status] || statusConfig.PENDING
            const StatusIcon = status.icon
            const date = new Date(session.scheduledAt)
            
            return (
              <div key={session.id} style={{
                background: isDark ? '#121212' : '#fff',
                borderRadius: 16, padding: 20, marginBottom: 12,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                {/* Date Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
                  borderRadius: 12, padding: '10px 14px', textAlign: 'center', flexShrink: 0,
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                    {date.toLocaleDateString('ar-SA', { month: 'short' })}
                  </div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
                    {date.getDate()}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                    {date.toLocaleDateString('ar-SA', { weekday: 'short' })}
                  </div>
                </div>
                
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ background: status.bg, color: status.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StatusIcon size={12}/> {status.label}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <User size={14} color="#6b7280"/>
                    <span style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontSize: 15, fontWeight: 600 }}>
                      {session.student?.profile?.firstName || session.studentName || 'طالب'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                      <Clock size={13}/>
                      {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      {session.duration && `  ${session.duration} دقيقة`}
                    </div>
                    {session.meetingMethod && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                        <Video size={13}/> {session.meetingMethod}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                {session.price && (
                  <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {session.price} ر.س
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}