'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export function FloatingAIButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  const items = [
    {
      label: 'مقابلة مع AI',
      sub:   '30 دقيقة · محادثة ذكية',
      path:  `/${locale}/dashboard/assessment?mode=interview`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      label: 'اختبار تفاعلي',
      sub:   '20 دقيقة · أسئلة ذكية',
      path:  `/${locale}/dashboard/assessment?mode=quiz`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    {
      label: 'مساري المهني',
      sub:   'نتائجك وخارطة طريقك',
      path:  `/${locale}/dashboard/career-path`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      <style>{`
        @keyframes _fab_pulse { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.18);opacity:.18} }
        @keyframes _fab_up    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ position: 'fixed', bottom: 90, left: 20, zIndex: 9998, direction: 'rtl' }}>
        {/* Menu */}
        {open && (
          <div style={{ position: 'absolute', bottom: 66, left: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '8px 0', minWidth: 230, boxShadow: '0 20px 48px rgba(0,0,0,0.45)', animation: '_fab_up .18s ease' }}>
            <div style={{ padding: '8px 16px 6px', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '.06em', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              DeveWay Career AI
            </div>
            {items.map(item => (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', textAlign: 'right', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif', fontWeight: 300, fontSize: 13 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: '#8b5cf6', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 1 }}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setOpen(v => !v)}
          title="DeveWay Career AI"
          style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: open ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#6d28d9,#4338ca)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(109,40,217,.5)', position: 'relative', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(139,92,246,.4)', animation: '_fab_pulse 2.2s ease infinite', pointerEvents: 'none' }} />
          {open
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
          }
          <div style={{ position: 'absolute', bottom: 3, right: 3, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--background)' }} />
        </button>
      </div>
    </>
  )
}
