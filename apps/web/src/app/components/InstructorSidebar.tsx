'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Video,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

// ════════════════════════════════════
// NAVIGATION ITEMS
// ════════════════════════════════════

const navItems = [
  { label: 'نظرة عامة', path: '', icon: LayoutDashboard },
  { label: 'كورساتي', path: '/my-courses', icon: BookOpen },
  { label: 'بدء كورس جديد', path: '/create-course', icon: PlusCircle },
  { label: 'المحاضرات', path: '/lectures', icon: Video },
  { label: 'الطلاب', path: '/students', icon: Users },
  { label: 'الإيرادات', path: '/earnings', icon: DollarSign },
  { label: 'الإعدادات', path: '/settings', icon: Settings },
]

// ════════════════════════════════════
// TOOLTIP COMPONENT
// ════════════════════════════════════

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
          className={`
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-2.5 py-1.5 rounded-md text-xs font-medium
            whitespace-nowrap shadow-xl z-50
            transition-colors duration-200
          `}
          style={{
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#1a1a2e',
            boxShadow: theme === 'dark' 
              ? '0 10px 25px -5px rgba(0,0,0,0.4)' 
              : '0 10px 25px -5px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.15s ease-out',
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

// ════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════

export function InstructorSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  
  // ── State ──
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
    // ✅ خلفية السايدبار: Dark→#0d0d0d | Light→#ffffff
    sidebarBg: theme === 'dark' ? '#0d0d0d' : '#ffffff',
    
    // حدود وفواصل
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    
    // خلفية العناصر الفرعية (Logo bg, Avatar bg)
    elementBg: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    
    // النصوص الرئيسية
    textPrimary: theme === 'dark' ? '#ffffff' : '#0d0d0d',
    
    // النصوص الثانوية (role labels)
    textSecondary: theme === 'dark' ? '#64748b' : '#6b7280',
    
    // أيقونات وروابط غير نشطة
    iconInactive: theme === 'dark' ? '#64748b' : '#94a3b8',
    
    // hover states
    hoverBg: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    hoverText: theme === 'dark' ? '#e2e8f0' : '#374151',
    
    // active state
    activeBg: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(81,32,200,0.08)',
    activeIndicator: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#5120c8',
    
    // collapse button
    collapseBtnHover: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    
    // tooltip arrow
    tooltipBg: theme === 'dark' ? '#1f2937' : '#ffffff',
  }

  // ── Computed ──
  const base = `/${locale}/dashboard`
  const firstName = user?.profile?.firstName ?? ''
  const lastName = user?.profile?.lastName ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'م'

  // ── Helpers ──
  const isActive = (path: string) => {
    if (path === '') {
      return pathname === base || pathname === `${base}/`
    }
    return pathname.startsWith(`${base}${path}`)
  }

  // ═══ RENDER ═══
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
      
      {/* ════════════════════════════════
          SECTION 1: LOGO
         ════════════════════════════════ */}
      <div 
        className={`
          flex items-center 
          ${isCollapsed ? 'justify-center py-4' : 'justify-between px-5 py-5'}
        `}
        style={{ borderBottom: `1px solid ${colors.borderColor}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="
              shrink-0 w-8 h-8 rounded-lg 
              flex items-center justify-center 
              font-bold text-sm transition-colors duration-300
            "
            style={{ 
              background: colors.elementBg, 
              color: colors.textPrimary 
            }}
          >
            D
          </div>
          
          {!isCollapsed && (
            <span 
              className="text-sm font-semibold tracking-tight shrink-0 transition-colors duration-300"
              style={{ 
                fontFamily: "'Inter', sans-serif",
                color: colors.textPrimary 
              }}
            >
              DeveWay
            </span>
          )}
        </div>

        {/* Collapse Toggle */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className={`
              shrink-0 w-6 h-6 rounded-md flex items-center justify-center
              transition-colors duration-150
            `}
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
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className={`
              shrink-0 w-6 h-6 rounded-md flex items-center justify-center
              transition-colors duration-150
            `}
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
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ════════════════════════════════
          SECTION 2: USER BLOCK
         ════════════════════════════════ */}
      <div 
        className={`
          ${isCollapsed ? 'flex justify-center py-4' : 'px-4 py-4'}
        `}
        style={{ borderBottom: `1px solid ${colors.borderColor}` }}
      >
        {isCollapsed ? (
          <Tooltip text={`${firstName} ${lastName}`} theme={theme}>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300"
              style={{ background: colors.elementBg, color: colors.textPrimary }}
            >
              {initials}
            </div>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <div 
              className="
                shrink-0 w-10 h-10 rounded-full 
                flex items-center justify-center 
                text-sm font-bold overflow-hidden
                transition-colors duration-300
              "
              style={{ background: colors.elementBg, color: colors.textPrimary }}
            >
              {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p 
                className="text-sm font-medium truncate transition-colors duration-300"
                style={{ color: colors.textPrimary }}
              >
                {firstName} {lastName}
              </p>
              <span 
                className="text-xs transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                محاضر
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════
          SECTION 3: AI FEATURE ⭐
         ════════════════════════════════ */}
      <nav className={`px-3 pt-4 ${isCollapsed ? 'px-2 pt-4' : ''}`}>
        
        {/* AI Link - Special Treatment */}
        <Link href={`${base}/ai-chat`}>
          <Tooltip text="DeveWay AI" theme={theme}>
            <div
              className={`
                group relative flex items-center rounded-lg
                transition-all duration-200 ease-out
                ${pathname.includes('ai-chat')
                  ? ''
                  : ''
                }
                ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
              `}
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
              {/* Active Indicator */}
              {pathname.includes('ai-chat') && !isCollapsed && (
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                  style={{ background: '#8b5cf6' }}
                />
              )}
              
              {/* Icon */}
              <Sparkles 
                className={`
                  shrink-0 transition-transform duration-200
                  ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}
                  group-hover:scale-110
                  ${pathname.includes('ai-chat') ? 'text-violet-400' : ''}
                `}
              />
              
              {/* Text */}
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1">DeveWay AI</span>
                  <span 
                    className="
                      text-[10px] font-semibold px-1.5 py-0.5 rounded
                    "
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      color: '#8b5cf6',
                    }}
                  >
                    AI
                  </span>
                </>
              )}
              
              {/* Active Dot for Collapsed */}
              {isCollapsed && pathname.includes('ai-chat') && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </div>
          </Tooltip>
        </Link>
      </nav>

      {/* ════════════════════════════════
          SECTION 4: NAVIGATION
         ════════════════════════════════ */}
      <nav className={`flex-1 px-3 py-2 space-y-0.5 overflow-y-auto ${isCollapsed ? 'px-2 py-2' : ''}`}>
        {navItems.map((item) => {
          const active = isActive(item.path)
          
          return (
            <Link key={item.path} href={`${base}${item.path}`}>
              <Tooltip text={item.label} theme={theme}>
                <div
                  className={`
                    group relative flex items-center rounded-lg
                    transition-all duration-200 ease-out
                    ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                  `}
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
                  {/* Active Indicator */}
                  {active && !isCollapsed && (
                    <div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                      style={{ background: colors.activeIndicator }}
                    />
                  )}
                  
                  {/* Icon */}
                  <item.icon 
                    className={`
                      shrink-0 transition-transform duration-200
                      ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}
                      group-hover:scale-110
                    `}
                  />
                  
                  {/* Text */}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  
                  {/* Active Dot for Collapsed */}
                  {isCollapsed && active && (
                    <div 
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: colors.activeIndicator }}
                    />
                  )}
                </div>
              </Tooltip>
            </Link>
          )
        })}
      </nav>

      {/* ════════════════════════════════
          SECTION 5: LOGOUT (Isolated)
         ════════════════════════════════ */}
      <div 
        className={`
          ${isCollapsed ? 'p-2 pt-3' : 'px-3 py-3'}
        `}
        style={{ borderTop: `1px solid ${colors.borderColor}` }}
      >
        <Tooltip text="تسجيل الخروج" theme={theme}>
          <button
            onClick={() => {
              logout()
              window.location.href = `/${locale}`
            }}
            className={`
              w-full flex items-center rounded-lg
              transition-all duration-200
              ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
            `}
            style={{
              color: '#ef4444',
            }}
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

      {/* ═══ CSS ANIMATIONS ═══ */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(4px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </aside>
  )
}