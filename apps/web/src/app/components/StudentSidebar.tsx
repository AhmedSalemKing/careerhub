'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  Users2,
  BookOpen,
  Award,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { label: 'نظرة عامة', path: '', icon: LayoutDashboard },
  { label: 'اختبار المسار', path: '/assessment', icon: ClipboardList },
  { label: 'مساري المهني', path: '/career-path', icon: Map },
  { label: 'الكوتشينج', path: '/coaching', icon: Users2 },
  { label: 'الكورسات', path: '/courses', icon: BookOpen },
  { label: 'الشهادات', path: '/certificates', icon: Award },
  { label: 'الإشعارات', path: '/notifications', icon: Bell },
  { label: 'الإعدادات', path: '/settings', icon: Settings },
]

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
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
            bg-gray-900 text-white whitespace-nowrap
            shadow-xl shadow-black/20 z-50
          "
        >
          {text}
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  )
}

export function StudentSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const base = `/${locale}/dashboard`
  const firstName = user?.profile?.firstName ?? ''
  const lastName = user?.profile?.lastName ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'ط'

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
      style={{ background: '#0f172a' }}
      dir="rtl"
    >
      {/* LOGO */}
      <div className={`flex items-center border-b border-white/[0.06] ${isCollapsed ? 'justify-center py-4' : 'justify-between px-5 py-5'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white" style={{ background: '#1e293b' }}>D</div>
          {!isCollapsed && <span className="text-sm font-semibold tracking-tight text-white shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>DeveWay</span>}
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors duration-150">
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* USER */}
      <div className={`border-b border-white/[0.06] ${isCollapsed ? 'flex justify-center py-4' : 'px-4 py-4'}`}>
        {isCollapsed ? (
          <Tooltip text={`${firstName} ${lastName}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#1e293b' }}>{initials}</div>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden" style={{ background: '#1e293b' }}>
              {user?.profile?.avatar ? <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{firstName} {lastName}</p>
              <span className="text-xs text-gray-500">طالب</span>
            </div>
          </div>
        )}
      </div>

      {/* AI FEATURE */}
      <nav className={`px-3 pt-4 ${isCollapsed ? 'px-2 pt-4' : ''}`}>
        <Link href={`${base}/ai-chat`}>
          <Tooltip text="DeveWay AI">
            <div className={`group relative flex items-center rounded-lg transition-all duration-200 ease-out ${pathname.includes('ai-chat') ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'} ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}>
              {pathname.includes('ai-chat') && !isCollapsed && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-violet-500" />}
              <Sparkles className={`shrink-0 transition-transform duration-200 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 ${pathname.includes('ai-chat') ? 'text-violet-400' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1">DeveWay AI</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">AI</span>
                </>
              )}
              {isCollapsed && pathname.includes('ai-chat') && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500" />}
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
              <Tooltip text={item.label}>
                <div className={`group relative flex items-center rounded-lg transition-all duration-200 ease-out ${active ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'} ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}>
                  {active && !isCollapsed && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-white/50" />}
                  <item.icon className={`shrink-0 transition-transform duration-200 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110`} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {isCollapsed && active && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/70" />}
                </div>
              </Tooltip>
            </Link>
          )
        })}
      </nav>

      {/* LOGOUT */}
      <div className={`border-t border-white/[0.06] ${isCollapsed ? 'p-2 pt-3' : 'px-3 py-3'}`}>
        <Tooltip text="تسجيل الخروج">
          <button onClick={() => { logout(); window.location.href = `/${locale}` }} className={`w-full flex items-center rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-200 ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}>
            <LogOut className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            {!isCollapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}