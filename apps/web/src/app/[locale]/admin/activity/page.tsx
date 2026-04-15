'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get } from '../../../../lib/api'
import { RefreshCw, Search } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  LOGIN:         '#2BBFA3',
  REGISTER:      '#10B981',
  VIEW_COURSES:  '#5120c8',
  PAYMENT:       '#F5A623',
  UPLOAD:        '#EF4444',
  BOOK_SESSION:  '#8B5CF6',
  AI_CHAT:       '#06B6D4',
  ASSESSMENT:    '#F59E0B',
  ADMIN_ACTION:  '#EF4444',
  CREATE_COURSE: '#2BBFA3',
}

export default function ActivityMonitor() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const { data: rawData = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await get('/admin/activity/live?limit=100')
      return (res as any).data?.data ?? []
    },
    refetchInterval: 15000,
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-activity-stats'],
    queryFn: async () => {
      const res = await get('/admin/activity/stats')
      return (res as any).data?.data ?? {}
    },
    refetchInterval: 30000,
  })

  const activities = (rawData as any[]).filter((a: any) => {
    const name = `${a.user?.profile?.firstName ?? ''} ${a.user?.profile?.lastName ?? ''} ${a.user?.email ?? ''}`.toLowerCase()
    return (!search || name.includes(search.toLowerCase())) &&
           (!filterAction || a.action === filterAction)
  })

  const uniqueActions = Array.from(new Set((rawData as any[]).map((a: any) => a.action as string)))

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', margin: 0 }}>
            {isAr ? 'مراقب النشاط' : 'Activity Monitor'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
            {activities.length} {isAr ? 'حدث' : 'events'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(81,32,200,0.1)', border: '1px solid rgba(81,32,200,0.3)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#A78BFA', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
        >
          <RefreshCw size={14} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: isAr ? 'متصل الآن' : 'Online Now', value: (stats as any)?.onlineUsers ?? 0, color: '#2BBFA3' },
          { label: isAr ? 'نشاط اليوم' : 'Today Activity', value: (stats as any)?.todayActivity ?? 0, color: '#5120c8' },
          { label: isAr ? 'إجمالي النشاط' : 'Total Activity', value: (stats as any)?.totalActivities ?? 0, color: '#F5A623' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search...'}
            style={{ width: '100%', padding: '9px 12px 9px 32px', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ padding: '9px 12px', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}
        >
          <option value="">{isAr ? 'كل الأفعال' : 'All Actions'}</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Feed */}
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(81,32,200,0.2)', borderTopColor: '#5120c8', borderRadius: '50%', animation: 'dw-spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>
            {isAr ? 'لا يوجد نشاط' : 'No activity found'}
          </div>
        ) : activities.map((act: any, i: number) => {
          const color = ACTION_COLORS[act.action] || '#5120c8'
          const name = act.user?.profile?.firstName
            ? `${act.user.profile.firstName} ${act.user.profile.lastName}`
            : act.user?.email?.split('@')[0] ?? '?'
          return (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'background 0.1s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color }}>
                {(act.user?.profile?.firstName?.[0] || act.user?.email?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif' }}>{name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${color}20`, color, fontFamily: 'DM Sans, sans-serif' }}>
                    {act.action}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'DM Sans, sans-serif' }}>
                  {act.user?.email}{act.entity ? ` · ${act.entity}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                {new Date(act.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
