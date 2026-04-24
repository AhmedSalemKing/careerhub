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
} from 'lucide-react'
import { api } from '../../../lib/api'
import BottomDock from '../../../components/BottomDock'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

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
      {/* Page */}
      <main className="p-6 lg:p-8" style={{ paddingTop: '80px' }}>
        {children}
      </main>

      {/* Top Dock for Admin */}
      <BottomDock items={adminItems} onLogout={handleLogout} position="top" />
    </div>
  )
}
