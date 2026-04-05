'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckCircle,
  Settings,
  LogOut,
  TrendingUp,
  Menu,
  X,
  Calendar,
} from 'lucide-react'
import { api } from '../../../lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [pendingUsersCount, setPendingUsersCount] = useState(0)
  const [pendingCoursesCount, setPendingCoursesCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem('deveway_user')
        if (!raw) { setAuthorized(false); return }
        const u = JSON.parse(raw)
        if (u?.accountType === 'ADMIN') {
          setAuthorized(true)
        } else {
          setAuthorized(false)
        }
      } catch { setAuthorized(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    if (authorized === false) {
      router.replace(`/${locale}/login`)
    }
  }, [authorized, locale, router])

  useEffect(() => {
    if (!authorized) return
    function fetchCounts() {
      api.get('/admin/pending-approvals')
        .then(res => setPendingUsersCount(Array.isArray(res.data?.data) ? res.data.data.length : 0))
        .catch(() => {})
      api.get('/admin/pending-courses')
        .then(res => setPendingCoursesCount(Array.isArray(res.data?.data) ? res.data.data.length : 0))
        .catch(() => {})
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [authorized])

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#050505' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  const totalPending = pendingUsersCount + pendingCoursesCount

  const NAV = [
    { href: 'admin', label: 'نظرة عامة', icon: LayoutDashboard },
    { href: 'admin/approvals', label: 'طلبات الموافقة', icon: CheckCircle, badge: totalPending },
    { href: 'admin/users', label: 'المستخدمون', icon: Users },
    { href: 'admin/courses', label: 'الكورسات', icon: BookOpen },
    { href: 'admin/sessions', label: 'الجلسات', icon: Calendar },
    { href: 'admin/revenue', label: 'الإيرادات', icon: TrendingUp },
    { href: 'admin/site-settings', label: 'إعدادات الموقع', icon: Settings },
  ]

  function handleLogout() {
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
      <div dir="rtl" className="flex h-screen overflow-hidden" style={{ background: '#0D0D0D', color: '#E6E6E6' }}>
        
        {/* ── Sidebar (Glossy Black) ── */}
        <aside
          className={`flex flex-col transition-all duration-200 border-l z-20 ${collapsed ? 'w-16' : 'w-64'}`}
          style={{ 
            background: '#050505', /* أسود غامق جداً للإطار */
            backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.03), transparent 70%)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5120c8] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_15px_rgba(81,32,200,0.3)]">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <div>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    DeveWay
                  </span>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1, letterSpacing: '0.5px' }}>لوحة الإدارة</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 space-y-1 px-3">
            {NAV.map(({ href, label, icon: Icon, badge }) => {
              const full = `/${locale}/${href}`
              const active = pathname === full || (href !== 'admin' && pathname.startsWith(full))
              return (
                <Link
                  key={href}
                  href={`/${locale}/${href}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden"
                  style={{
                    background: active ? 'rgba(81,32,200,0.15)' : 'transparent',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    borderRight: active ? '3px solid #5120c8' : '3px solid transparent',
                  }}
                >
                  {/* Active Glow */}
                  {active && (
                    <div className="absolute inset-0 bg-[#5120c8]/5 blur-md" />
                  )}
                  
                  <Icon size={18} className="shrink-0 relative z-10" style={{ color: active ? '#a78bfa' : 'inherit' }} />
                  {!collapsed && (
                    <span className="flex-1 relative z-10 font-medium">{label}</span>
                  )}
                  {!collapsed && badge && badge > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/90 text-white text-[10px] font-bold shadow-lg relative z-10">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 group"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
              {!collapsed && <span className="group-hover:text-white transition-colors">تسجيل الخروج</span>}
            </button>
          </div>
        </aside>

        {/* ── Main content (Glossy Background) ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Background Glow Effects */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 60%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02), transparent 60%)
            `,
            zIndex: 0
          }} />

          {/* Top bar */}
          <header className="relative z-10 h-16 flex items-center px-6 justify-between shrink-0 backdrop-blur-md" style={{ 
            background: 'rgba(13, 13, 13, 0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>
              لوحة تحكم DeveWay
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-md">
                م
              </div>
            </div>
          </header>

          {/* Page */}
          <main className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}