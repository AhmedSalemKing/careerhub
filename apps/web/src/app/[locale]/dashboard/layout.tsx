'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { get } from '../../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import BottomDock from '../../../components/BottomDock'
import { 
  LayoutDashboard, BookOpen, PlusCircle, BarChart2,
  Calendar, CalendarDays, DollarSign, Wallet,
  Brain, MessageSquare, Award, Settings,
  Shield, Users, Bell, ClipboardList, CalendarCheck,
  X, Menu, Briefcase
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate, logout } = useAuthStore()
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
      { icon: Award, labelAr: 'ملفي', labelEn: 'Profile', href: `/${locale}/dashboard/consultant-profile` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
    
    if (accountType === 'CONSULTANT') return [
      { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Home', href: `/${locale}/dashboard` },
      { icon: Calendar, labelAr: 'جلساتي', labelEn: 'Sessions', href: `/${locale}/dashboard/my-sessions` },
      { icon: CalendarDays, labelAr: 'الجدول', labelEn: 'Schedule', href: `/${locale}/dashboard/schedule` },
      { icon: DollarSign, labelAr: 'أرباحي', labelEn: 'Earnings', href: `/${locale}/dashboard/earnings` },
      { icon: Award, labelAr: 'ملفي', labelEn: 'Profile', href: `/${locale}/dashboard/consultant-profile` },
      { icon: Wallet, labelAr: 'محفظتي', labelEn: 'Wallet', href: `/${locale}/dashboard/wallet` },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
    ]
    
return [
      { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Home', href: `/${locale}/dashboard` },
      { icon: BookOpen, labelAr: 'كورساتي', labelEn: 'Courses', href: `/${locale}/dashboard/my-courses` },
      { icon: CalendarCheck, labelAr: 'جلساتي', labelEn: 'Sessions', href: `/${locale}/dashboard/my-sessions` },
      { icon: Brain, labelAr: 'المسار المهني', labelEn: 'Career', href: `/${locale}/dashboard/career-path` },
      { icon: MessageSquare, labelAr: 'المساعد الذكي', labelEn: 'AI', href: `/${locale}/dashboard/ai-chat` },
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certs', href: `/${locale}/dashboard/certificates` },
      { icon: Wallet, labelAr: 'محفظتي', labelEn: 'Wallet', href: `/${locale}/dashboard/wallet` },
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

  useEffect(() => {
    if (!mounted || !user) return

    if (user.status === 'PENDING' || user.status === 'BANNED' || user.status === 'REJECTED') {
      const error = user.status === 'PENDING' ? 'pending_approval' : 'account_rejected'
      logout()
      router.replace(`/${locale}/login?error=${error}`)
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
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen dashboard-root" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          {/* Overlay */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          )}
          
          {/* Drawer */}
          <div className={`fixed top-0 bottom-0 z-50 w-[280px] bg-[color:var(--surface)] shadow-2xl transition-transform duration-300 lg:hidden ${
            sidebarOpen ? (isAr ? 'translate-x-0' : 'translate-x-0') : (isAr ? 'translate-x-full' : '-translate-x-full')
          }`} style={{ right: isAr ? 0 : 'auto', left: isAr ? 'auto' : 0 }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
              <span className="font-bold text-foreground text-lg">DeveWay</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full bg-[color:var(--surface-2)]">
                <X className="h-4 w-4 text-[color:var(--muted)]" />
              </button>
            </div>
            
            {/* Drawer nav items */}
            <nav className="p-3 space-y-1">
              {dockItems.map((item: any, i: number) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a key={i} href={item.href}
                    onClick={() => setSidebarOpen(false)}
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
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center p-1 -mr-1">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <span className="font-bold text-foreground">{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
        </div>
      )}

      {/* Page content */}
      <main className="main-content">
        <div className="page-content" style={{ paddingBottom: '100px', paddingTop: '24px' }}>
          {children}
        </div>
      </main>

      {/* Bottom Dock */}
      <BottomDock items={dockItems} onLogout={handleLogout} position="bottom" />
    </div>
  )
}
