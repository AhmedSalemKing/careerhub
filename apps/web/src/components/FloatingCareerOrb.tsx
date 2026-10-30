'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

const IcChat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IcQuiz = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const IcPath = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const IcBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
    <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/>
    <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
)

const menuItems = [
  {
    labelAr: 'مقابلة AI',
    labelEn: 'AI Interview',
    path: '/dashboard/assessment?mode=interview',
    icon: <IcChat />,
  },
  {
    labelAr: 'اختبار تفاعلي',
    labelEn: 'Interactive Quiz',
    path: '/dashboard/assessment?mode=quiz',
    icon: <IcQuiz />,
  },
  {
    labelAr: 'مساري المهني',
    labelEn: 'Career Path',
    path: '/dashboard/career-path',
    icon: <IcPath />,
  },
]

export default function FloatingCareerOrb() {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  return (
    <div style={{ position: 'fixed', bottom: 90, left: 20, zIndex: 9998, direction: 'rtl' }}>
      {/* Mini menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            background: 'var(--card)',
            border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
            borderRadius: 14,
            padding: '6px 0',
            minWidth: 190,
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            animation: 'floatOrbFadeIn 0.15s ease',
          }}
        >
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                router.push(`/${locale}${item.path}`)
                setShowMenu(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground)',
                cursor: 'pointer',
                textAlign: 'right',
                fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
                fontWeight: 300,
                fontSize: 13,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 6%, transparent)')
              }
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: '#8b5cf6', flexShrink: 0 }}>{item.icon}</span>
              {locale === 'ar' ? item.labelAr : item.labelEn}
            </button>
          ))}
        </div>
      )}

      {/* Main orb button */}
      <button
        onClick={() => setShowMenu(v => !v)}
        title={locale === 'ar' ? 'مساعد DeveWay الذكي' : 'DeveWay AI Assistant'}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: showMenu
            ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
            : 'linear-gradient(135deg, #5b21b6, #4338ca)',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(139,92,246,0.45)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulse ring */}
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid rgba(139,92,246,0.35)',
            animation: 'floatOrbPulse 2s ease infinite',
            pointerEvents: 'none',
          }}
        />
        <IcBrain />
        {/* Online dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 3,
            right: 3,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--background)',
          }}
        />
      </button>

      <style>{`
        @keyframes floatOrbPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes floatOrbFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
