'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { label: 'نظرة عامة', path: '', icon: LayoutDashboard },
  { label: 'جلساتي', path: '/my-sessions', icon: Calendar },
  { label: 'مواعيدي', path: '/availability', icon: Clock },
  { label: 'الإيرادات', path: '/earnings', icon: DollarSign },
  { label: 'التقييمات', path: '/reviews', icon: Star },
  { label: 'الإعدادات', path: '/settings', icon: Settings },
]

function Tooltip({ text, children, theme }: { text: string; children: React.ReactNode; theme: 'light' | 'dark' }) {
  const [show, setShow] = useState(false)
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          className="
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-2.5 py-1.5 rounded-md text-xs font-medium
            whitespace-nowrap shadow-xl z-50
          "
          style={{
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#1a1a2e',
            boxShadow: theme === 'dark' 
              ? '0 10px 25px -5px rgba(0,0,0,0.4)' 
              : '0 10px 25px -5px rgba(0,0,0,0.15)',
          }}
        >
          {text}
          <div 
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45" 
            style={{ background: theme === 'dark' ? '#1f2937' : '#ffffff' }}
          />
        </div>
      )}
    </div>
  )
}

export function ConsultantSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 🎨 حالة الثيم (فاتح/داكن)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // 🔄 الكشف عن الثيم عند التحميل
  useEffect(() => {
    const detectTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (systemPrefersDark) {
        setTheme('dark')
      } else {
        setTheme('light')
      }
    }

    // تشغيل الكشف فوراً
    detectTheme()

    // 🔄 الاستماع للتغييرات في الوقت الفعلي
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (newTheme) setTheme(newTheme)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // تحديث دوري
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [theme])

  // 🎨 نظام الألوان الديناميكي
  const colors = {
    sidebarBg: theme === 'dark' ? '#0d0d0d' : '#ffffff',
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    elementBg: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    textPrimary: theme === 'dark' ? '#ffffff' : '#0d0d0d',
    textSecondary: theme === 'dark' ? '#64748b' : '#6b7280',
    iconInactive: theme === 'dark' ? '#64748b' : '#94a3b8',
    hoverBg: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    hoverText: theme === 'dark' ? '#e2e8f0' : '#374151',
    activeBg: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(81,32,200,0.08)',
    activeIndicator: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#5120c8',
    collapseBtnHover: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }

  const base = `/${locale}/dashboard`
  const firstName = user?.profile?.firstName ?? ''
  const lastName = user?.profile?.lastName ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'م'

  const isActive = (path: string) => {
    if (path === '') return pathname === base || pathname === `${base}/`
    return pathname.startsWith(`${base}${path}`)
  }

  return (
    <aside
      className={`
        h-screen flex flex-col overflow-hidden
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCollapsed ? 'w-[68px]' : 'w-[256px]'}
      `}
      style={{ 
        background: colors.sidebarBg,
        borderLeft: `1px solid ${colors.borderColor}`,
      }}
      dir="rtl"
    >
      {/* LOGO */}
      <div 
        className={`flex items-center ${isCollapsed ? 'justify-center py-4' : 'justify-between px-5 py-5'}`}
        style={{ borderBottom: `1px solid ${colors.borderColor}` }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors duration-300"
            style={{ background: colors.elementBg, color: colors.textPrimary }}
          >D</div>
          {!isCollapsed && (
            <span 
              className="text-sm font-semibold tracking-tight shrink-0 transition-colors duration-300"
              style={{ fontFamily: "'Inter', sans-serif", color: colors.textPrimary }}
            >DeveWay</span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-150"
          style={{ color: colors.iconInactive }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.textPrimary
            e.currentTarget.style.background = colors.collapseBtnHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.iconInactive
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* USER */}
      <div 
        className={`${isCollapsed ? 'flex justify-center py-4' : 'px-4 py-4'}`}
        style={{ borderBottom: `1px solid ${colors.borderColor}` }}
      >
        {isCollapsed ? (
          <Tooltip text={`${firstName} ${lastName}`} theme={theme}>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300"
              style={{ background: colors.elementBg, color: colors.textPrimary }}
            >{initials}</div>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <div 
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden transition-colors duration-300"
              style={{ background: colors.elementBg, color: colors.textPrimary }}
            >
              {user?.profile?.avatar ? <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate transition-colors duration-300" style={{ color: colors.textPrimary }}>{firstName} {lastName}</p>
              <span className="text-xs transition-colors duration-300" style={{ color: colors.textSecondary }}>مستشار</span>
            </div>
          </div>
        )}
      </div>

      {/* AI FEATURE */}
      <nav className={`px-3 pt-4 ${isCollapsed ? 'px-2 pt-4' : ''}`}>
        <Link href={`${base}/ai-chat`}>
          <Tooltip text="DeveWay AI" theme={theme}>
            <div 
              className={`group relative flex items-center rounded-lg transition-all duration-200 ease-out ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
              style={{
                background: pathname.includes('ai-chat') ? colors.activeBg : 'transparent',
                color: pathname.includes('ai-chat') ? colors.textPrimary : colors.iconInactive,
              }}
              onMouseEnter={(e) => {
                if (!pathname.includes('ai-chat')) {
                  e.currentTarget.style.background = colors.hoverBg
                  e.currentTarget.style.color = colors.hoverText
                }
              }}
              onMouseLeave={(e) => {
                if (!pathname.includes('ai-chat')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.iconInactive
                }
              }}
            >
              {pathname.includes('ai-chat') && !isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-violet-500" />
              )}
              <Sparkles className={`shrink-0 transition-transform duration-200 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 ${pathname.includes('ai-chat') ? 'text-violet-400' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1">DeveWay AI</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">AI</span>
                </>
              )}
              {isCollapsed && pathname.includes('ai-chat') && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </div>
          </Tooltip>
        </Link>
      </nav>

      {/* NAVIGATION */}
      <nav className={`flex-1 px-3 py-2 space-y-0.5 overflow-y-auto ${isCollapsed ? 'px-2 py-2' : ''}`}>
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link key={item.path} href={`${base}${item.path}`}>
              <Tooltip text={item.label} theme={theme}>
                <div 
                  className={`group relative flex items-center rounded-lg transition-all duration-200 ease-out ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
                  style={{
                    background: active ? colors.activeBg : 'transparent',
                    color: active ? colors.textPrimary : colors.iconInactive,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = colors.hoverBg
                      e.currentTarget.style.color = colors.hoverText
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = colors.iconInactive
                    }
                  }}
                >
                  {active && !isCollapsed && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full" style={{ background: colors.activeIndicator }} />
                  )}
                  <item.icon className={`shrink-0 transition-transform duration-200 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110`} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {isCollapsed && active && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: colors.activeIndicator }} />
                  )}
                </div>
              </Tooltip>
            </Link>
          )
        })}
      </nav>

      {/* LOGOUT */}
      <div 
        className={`${isCollapsed ? 'p-2 pt-3' : 'px-3 py-3'}`}
        style={{ borderTop: `1px solid ${colors.borderColor}` }}
      >
        <Tooltip text="تسجيل الخروج" theme={theme}>
          <button 
            onClick={() => { logout(); window.location.href = `/${locale}` }} 
            className={`w-full flex items-center rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
            style={{ color: '#ef4444' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171'
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#ef4444'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            {!isCollapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}