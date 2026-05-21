'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckCircle,
  Settings,
  TrendingUp,
  Calendar,
  Activity,
  ExternalLink,
  Menu,
  LogOut,
  X,
} from 'lucide-react'
import { api } from '../../../lib/api'
import BottomDock from '../../../components/BottomDock'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const isAr = locale === 'ar'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem('deveway_user')
        if (!raw) { setAuthorized(false); return }
        const u = JSON.parse(raw)
        if (u?.accountType === 'ADMIN' || u?.accountType === 'SUPER_ADMIN') {
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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  const adminItems = [
    { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Dashboard', href: `/${locale}/admin` },
    { icon: Users, labelAr: 'المستخدمون', labelEn: 'Users', href: `/${locale}/admin/users` },
    { icon: BookOpen, labelAr: 'الكورسات', labelEn: 'Courses', href: `/${locale}/admin/courses` },
    { icon: CheckCircle, labelAr: 'الموافقات', labelEn: 'Approvals', href: `/${locale}/admin/approvals` },
    { icon: Calendar, labelAr: 'الجلسات', labelEn: 'Sessions', href: `/${locale}/admin/sessions` },
    { icon: TrendingUp, labelAr: 'الإيرادات', labelEn: 'Revenue', href: `/${locale}/admin/revenue` },
    { icon: Activity, labelAr: 'النشاط', labelEn: 'Activity', href: `/${locale}/admin/activity` },
    { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/admin/site-settings` },
    { icon: ExternalLink, labelAr: 'الموقع الرئيسي', labelEn: 'Main Site', href: `/${locale}` },
  ]

  function handleLogout() {
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      
      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          {/* Overlay */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />
          )}

          {/* Drawer panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              zIndex: 51,
              background: 'var(--card)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease',
            }}
          >
            {/* Drawer header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #5120C8, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                    fontFamily: 'var(--font-brand)',
                    flexShrink: 0,
                  }}
                >
                  D
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-brand)',
                    fontWeight: 800,
                    fontSize: 18,
                    color: 'var(--foreground)',
                  }}
                >
                  DeveWay
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '12px 10px' }}>
              {adminItems.filter((item: any) => item.icon !== ExternalLink).map((item: any, i: number) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a
                    key={i}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: 12,
                      marginBottom: '2px',
                      color: active ? '#5120C8' : 'var(--foreground)',
                      background: active ? 'rgba(81,32,200,0.1)' : 'transparent',
                      fontWeight: active ? 700 : 500,
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                      borderRight: active ? '3px solid #5120C8' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--surface)'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </a>
                )
              })}
            </nav>

            {/* Bottom section */}
            <div
              style={{
                padding: '12px 10px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <a
                href={`/${locale}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: 12,
                  color: '#5120C8',
                  fontSize: '14px',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  transition: 'background 0.15s',
                  opacity: 0.8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(81,32,200,0.06)'
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.opacity = '0.8'
                }}
              >
                <ExternalLink size={16} />
                <span>{isAr ? 'الموقع الرئيسي' : 'Main Site'}</span>
              </a>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 14px',
                  borderRadius: 12,
                  color: '#ef4444',
                  background: 'transparent',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <LogOut size={16} />
                <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Mobile header */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <button onClick={() => setDrawerOpen(true)} className="flex items-center justify-center p-1 -mr-1">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <span className="font-bold text-foreground">{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</span>
        </div>
      )}

      {/* Page */}
      <main className="p-6 lg:p-8" style={{ paddingTop: '80px' }}>
        {children}
      </main>

      {/* Top Dock for Admin */}
      <BottomDock items={adminItems} onLogout={handleLogout} position="top" />
    </div>
  )
}
