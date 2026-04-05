'use client'

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
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { labelAr: 'نظرة عامة', path: '', icon: LayoutDashboard },
  { labelAr: 'اختبار المسار', path: '/assessment', icon: ClipboardList },
  { labelAr: 'مساري المهني', path: '/career-path', icon: Map },
  { labelAr: 'الكوتشينج', path: '/coaching', icon: Users2 },
  { labelAr: 'الكورسات', path: '/courses', icon: BookOpen },
  { labelAr: 'الشهادات', path: '/certificates', icon: Award },
  { labelAr: 'الإشعارات', path: '/notifications', icon: Bell },
  { labelAr: 'الإعدادات', path: '/settings', icon: Settings },
]

export function StudentSidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const base = `/${locale}/dashboard`
  const firstName = user?.profile?.firstName ?? ''
  const lastName = user?.profile?.lastName ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'ط'

  return (
    <aside
      className="sticky top-0 h-screen w-64 shrink-0 flex flex-col overflow-hidden"
      style={{ 
        background: '#050505',
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 40%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)' 
      }}
      dir="rtl"
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5120c8] to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
             <span className="text-white font-bold text-sm">D</span>
          </div>
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: 20,
            color: '#ffffff', letterSpacing: '-0.02em',
          }}>DeveWay</span>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'rgba(43,191,163,0.2)', border: '1px solid rgba(43,191,163,0.3)' }}>
          {user?.profile?.avatar
            ? <img src={user.profile.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
            : initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold" style={{ color: '#ffffff' }}>{firstName} {lastName}</div>
          <div className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(43,191,163,0.15)', color: '#34D399' }}>
            طالب
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* AI Chat */}
        <Link
          href={`${base}/ai-chat`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-1"
          style={{
            background: pathname.includes('ai-chat') ? 'rgba(81,32,200,0.15)' : 'rgba(81,32,200,0.05)',
            color: pathname.includes('ai-chat') ? '#ffffff' : 'rgba(167,139,250,0.8)',
            borderLeft: pathname.includes('ai-chat') ? '3px solid #5120c8' : '3px solid transparent',
          }}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          DeveWay AI
          <span className="mr-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(81,32,200,0.2)', color: '#A78BFA' }}>
            AI
          </span>
        </Link>

        {navItems.map((item) => {
          const href = `${base}${item.path}`
          const isActive = item.path === ''
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(href)
          return (
            <Link
              key={item.path}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/[0.03]"
              style={{
                background: isActive ? 'rgba(81,32,200,0.15)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                borderLeft: isActive ? '3px solid #5120c8' : '3px solid transparent',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.labelAr}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/[0.05]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}