'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { get } from '../../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import BottomDock from '../../../components/BottomDock'
import { DashboardSidebar } from '../../components/DashboardSidebar'
import { RealTimeClock } from '../../../components/RealTimeClock'
import { StopSpeechOnNav } from '../../../components/ai/StopSpeechOnNav'
import { 
  LayoutDashboard, BookOpen, PlusCircle, BarChart2,
  Calendar, CalendarDays, DollarSign,
  Brain, MessageSquare, Award, Settings,
  Shield, Users, Bell, ClipboardList, CalendarCheck,
  X, Menu, LogOut, Receipt
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate, logout, setUser: setUserStore } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isAr = locale === 'ar'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const accountType = user?.accountType || 'STUDENT'

  const dockItems = useMemo(() => {
    if (accountType === 'ADMIN') return [
      { icon: Shield, labelAr: 'الإدارة', labelEn: 'Admin', href: `/${locale}/admin` },
      { icon: Users, labelAr: 'المستخدمون', labelEn: 'Users', href: `/${locale}/admin/users` },
      { icon: BookOpen, labelAr: 'الكورسات', labelEn: 'Courses', href: `/${locale}/admin/courses` },
      { icon: Bell, labelAr: 'الموافقات', labelEn: 'Approvals', href: `/${locale}/admin/approvals` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
    
    if (accountType === 'INSTRUCTOR') return [
      { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Home', href: `/${locale}/dashboard` },
      { icon: BookOpen, labelAr: 'كورساتي', labelEn: 'Courses', href: `/${locale}/dashboard/my-courses` },
      { icon: PlusCircle, labelAr: 'كورس جديد', labelEn: 'New', href: `/${locale}/dashboard/create-course` },
      { icon: BarChart2, labelAr: 'إحصائيات', labelEn: 'Stats', href: `/${locale}/dashboard/analytics` },
      { icon: DollarSign, labelAr: 'الإيرادات', labelEn: 'Revenue', href: `/${locale}/dashboard/revenue` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
    
    if (accountType === 'CONSULTANT') return [
      { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Home', href: `/${locale}/dashboard` },
      { icon: CalendarDays, labelAr: 'جدول المواعيد', labelEn: 'Schedule', href: `/${locale}/dashboard/schedule` },
      { icon: Calendar, labelAr: 'جلساتي', labelEn: 'Sessions', href: `/${locale}/dashboard/my-sessions` },
      { icon: Users, labelAr: 'جلسات عملائي', labelEn: 'Client Sessions', href: `/${locale}/dashboard/client-sessions` },
      { icon: DollarSign, labelAr: 'أرباحي', labelEn: 'Earnings', href: `/${locale}/dashboard/earnings` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
    
return [
      { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Home', href: `/${locale}/dashboard` },
      { icon: BookOpen, labelAr: 'كورساتي', labelEn: 'Courses', href: `/${locale}/dashboard/my-courses` },
      { icon: CalendarCheck, labelAr: 'جلساتي', labelEn: 'Sessions', href: `/${locale}/dashboard/my-sessions` },
      { icon: Receipt, labelAr: 'تاريخ المدفوعات', labelEn: 'Payment History', href: `/${locale}/dashboard/invoices` },
      { icon: Brain, labelAr: 'المسار المهني', labelEn: 'Career', href: `/${locale}/dashboard/career-path` },
      { icon: MessageSquare, labelAr: 'المساعد الذكي', labelEn: 'AI', href: `/${locale}/dashboard/ai-chat` },
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certs', href: `/${locale}/dashboard/certificates` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
  }, [accountType, locale])

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

  // Prefetch critical data on mount
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: () => get('/auth/me').then((r) => (r.data as any)?.data),
      staleTime: 5 * 60 * 1000,
    })
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => get('/notifications').then((r) => (r.data as any)?.data ?? []),
      staleTime: 2 * 60 * 1000,
    })
  }, [queryClient])

  // Fetch fresh user data from /auth/me once per mount and update the store if
  // accountType changed. Guarded by a ref: the previous version depended on
  // `user` and wrote `setUserStore({ ...user, ...freshUser })` — a brand-new
  // user object — which re-ran this effect, refetching /auth/me in a loop
  // (the 6x-per-load symptom).
  const refreshedMeRef = useRef(false)
  useEffect(() => {
    if (!user || refreshedMeRef.current) return
    refreshedMeRef.current = true
    const fetchMe = async () => {
      try {
        const res = await get('/auth/me')
        const freshUser = (res.data as any)?.data
        if (freshUser && freshUser.accountType) {
          // Update store if accountType is missing or changed
          if (!user.accountType || freshUser.accountType !== user.accountType) {
            setUserStore({ ...user, ...freshUser })
          }
        }
      } catch (err) {
        console.error('[LAYOUT] Failed to fetch /auth/me:', err)
      }
    }
    fetchMe()
    // Intentionally runs once per mount; `user` is read as the initial snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUserStore])

  useEffect(() => {
    if (!mounted || !user) return

    if (user.status === 'PENDING' || user.status === 'BANNED' || user.status === 'REJECTED') {
      const error = user.status === 'PENDING' ? 'pending_approval' : 'account_rejected'
      // Through learn's /logout so its session is cleared too, then land on login with the error
      logout(`/${locale}/login?error=${error}`)
    }
  }, [mounted, user, locale, logout, router])

  // Full-screen mode for AI chat
  const isAiChat = pathname?.includes('ai-chat')

  if (isAiChat) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {children}
      </div>
    )
  }

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ backgroundColor: 'var(--background)' }}>
        <main className="p-6 lg:p-8">
          <div className="space-y-4 max-w-7xl mx-auto">
            <Skeleton className="h-12 w-56 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
            <div className="grid gap-5 sm:grid-cols-3 mt-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  function handleLogout() {
    // authStore.logout() clears web storage and cookies, then redirects through
    // learn's /logout so both apps are signed out.
    logout()
    window.dispatchEvent(new Event('auth:updated'))
  }

  return (
    <div className="min-h-screen dashboard-root dw-dashboard bg-background text-foreground" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ overflowX: 'clip' }}>
      
      {/* MOBILE DRAWER - only rendered when open to prevent overflow from off-screen transforms */}
      {isMobile && sidebarOpen && (
        <>
          {/* Overlay */}
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          
          {/* Drawer */}
          <div className="dw-dash-drawer" style={{ right: isAr ? 0 : 'auto', left: isAr ? 'auto' : 0 }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-2 pb-3">
              <span className="dw-dash-logo">DeveWay</span>
              <button onClick={() => setSidebarOpen(false)} className="dw-dash-close" aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="dw-dash-user">
                <p className="name">{user?.profile?.firstName || (user as any)?.name || ''}</p>
                <p className="email">{user?.email}</p>
              </div>
            )}

            {/* Drawer nav items */}
            <nav className="flex flex-col gap-1">
              {dockItems.map((item: any, i: number) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a key={i} href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`dw-dash-link${isActive ? ' active' : ''}`}
                  >
                    <Icon />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </a>
                )
              })}

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--line)', margin: '12px 0' }} />

              {/* Logout */}
              <button onClick={handleLogout} className="dw-dash-link logout">
                <LogOut />
                <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </nav>
          </div>
        </>
      )}
      
      {/* Mobile header */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center p-1 -mr-1">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <span className="font-bold text-foreground">{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
        </div>
      )}

      <div className="dw-dash-body">
        <DashboardSidebar items={dockItems} onLogout={handleLogout} />
        {/* Page content */}
        <main className="main-content overflow-x-hidden w-full max-w-[100vw]" style={{ overflowX: 'clip', maxWidth: '100%', minWidth: 0 }}>
          <div className="page-content" style={{ paddingBottom: '100px', paddingTop: '24px' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Dock */}
      <div className="dw-dashboard-dock">
        <BottomDock items={dockItems} onLogout={handleLogout} position="bottom" />
      </div>
      <RealTimeClock locale={locale} />
      {/* Floating AI Button — students/consultants/instructors only */}
      <StopSpeechOnNav />
    </div>
  )
}
