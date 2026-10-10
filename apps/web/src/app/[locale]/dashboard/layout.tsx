'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../../stores/authStore'
import { get } from '../../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import BottomDock from '../../../components/BottomDock'
import { RealTimeClock } from '../../../components/RealTimeClock'
import { 
  LayoutDashboard, BookOpen, PlusCircle, BarChart2,
  Calendar, CalendarDays, DollarSign, Wallet,
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

  // Debug: log accountType to verify
  console.log('[LAYOUT] user accountType:', user?.accountType, '| resolved:', accountType)

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
      { icon: Calendar, labelAr: 'جلساتي', labelEn: 'Sessions', href: `/${locale}/dashboard/my-sessions` },
      { icon: Users, labelAr: 'جلسات عملائي', labelEn: 'Client Sessions', href: `/${locale}/dashboard/client-sessions` },
      { icon: DollarSign, labelAr: 'أرباحي', labelEn: 'Earnings', href: `/${locale}/dashboard/earnings` },
      { icon: Wallet, labelAr: 'محفظتي', labelEn: 'Wallet', href: `/${locale}/dashboard/wallet` },
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

  // Fetch fresh user data from /auth/me and update store if accountType changed
  useEffect(() => {
    if (!user) return
    const fetchMe = async () => {
      try {
        const res = await get('/auth/me')
        const freshUser = (res.data as any)?.data
        if (freshUser && freshUser.accountType) {
          // Update store if accountType is missing or changed
          if (!user.accountType || freshUser.accountType !== user.accountType) {
            console.log('[LAYOUT] Updating user from /auth/me:', { old: user.accountType, new: freshUser.accountType })
            setUserStore({ ...user, ...freshUser })
          }
        }
      } catch (err) {
        console.error('[LAYOUT] Failed to fetch /auth/me:', err)
      }
    }
    fetchMe()
  }, [user, setUserStore])

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
    <div className="min-h-screen dashboard-root bg-background text-foreground" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ overflowX: 'clip' }}>
      
      {/* MOBILE DRAWER - only rendered when open to prevent overflow from off-screen transforms */}
      {isMobile && sidebarOpen && (
        <>
          {/* Overlay */}
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          
          {/* Drawer */}
          <div className="fixed top-0 bottom-0 z-50 w-[280px] shadow-2xl" style={{
            right: isAr ? 0 : 'auto', left: isAr ? 'auto' : 0,
            background: 'rgba(13, 13, 13, 0.97)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between p-5">
              <span className="font-bold text-white text-lg">
                <span style={{ color: '#5120C8' }}>Deve</span>Way
              </span>
              <button onClick={() => setSidebarOpen(false)}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
                }}>
                <X className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div style={{
                margin: '0 12px 12px', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>{user?.profile?.firstName || user?.name || ''}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{user?.email}</p>
              </div>
            )}
            
            {/* Drawer nav items */}
            <nav className="p-3 space-y-1">
              {dockItems.map((item: any, i: number) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <a key={i} href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 16px', borderRadius: '10px',
                      textDecoration: 'none', fontSize: '14px', fontWeight: 600,
                      background: isActive ? 'rgba(81,32,200,0.15)' : 'transparent',
                      color: isActive ? '#5120C8' : 'rgba(255,255,255,0.6)',
                      border: isActive ? '1px solid rgba(81,32,200,0.25)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </a>
                )
              })}
              
              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />

              {/* Logout */}
              <button onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '11px 16px', borderRadius: '10px',
                  background: 'rgba(22, 163, 74, 0.1)',
                  color: 'rgb(22, 163, 74)',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                <LogOut className="h-5 w-5" />
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

      {/* Page content */}
      <main className="main-content overflow-x-hidden w-full max-w-[100vw]" style={{ overflowX: 'clip', maxWidth: '100%', minWidth: 0 }}>
        <div className="page-content" style={{ paddingBottom: '100px', paddingTop: '24px' }}>
          {children}
        </div>
      </main>

      {/* Bottom Dock */}
      <BottomDock items={dockItems} onLogout={handleLogout} position="bottom" />
      <RealTimeClock locale={locale} />
    </div>
  )
}
