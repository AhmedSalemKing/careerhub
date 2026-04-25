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
            <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          )}
          
          {/* Drawer */}
          <div className={`fixed top-0 bottom-0 z-50 w-[280px] bg-[color:var(--surface)] shadow-2xl transition-transform duration-300 lg:hidden ${
            drawerOpen ? (isAr ? 'translate-x-0' : 'translate-x-0') : (isAr ? 'translate-x-full' : '-translate-x-full')
          }`} style={{ [isAr ? 'right' : 'left']: 0 }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
              <span className="font-bold text-foreground text-lg">DeveWay</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-full bg-[color:var(--surface-2)]">
                <X className="h-4 w-4 text-[color:var(--muted)]" />
              </button>
            </div>
            
            {/* Drawer nav items */}
            <nav className="p-3 space-y-1">
              {adminItems.map((item: any, i: number) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a key={i} href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{isAr ? item.labelAr : item.labelEn}</span>
                  </a>
                )
              })}
              
              {/* Logout */}
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all mt-4"
              >
                <X className="h-5 w-5" />
                <span className="font-semibold">{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </nav>
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
