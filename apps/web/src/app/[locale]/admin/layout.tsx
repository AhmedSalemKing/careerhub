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
    { icon: LayoutDashboard, label: 'Dashboard', labelAr: 'الرئيسية', href: `/${locale}/admin` },
    { icon: Users, label: 'Users', labelAr: 'المستخدمون', href: `/${locale}/admin/users` },
    { icon: BookOpen, label: 'Courses', labelAr: 'الكورسات', href: `/${locale}/admin/courses` },
    { icon: CheckCircle, label: 'Approvals', labelAr: 'الموافقات', href: `/${locale}/admin/approvals` },
    { icon: Calendar, label: 'Sessions', labelAr: 'الجلسات', href: `/${locale}/admin/sessions` },
    { icon: TrendingUp, label: 'Revenue', labelAr: 'الإيرادات', href: `/${locale}/admin/revenue` },
    { icon: Activity, label: 'Activity', labelAr: 'النشاط', href: `/${locale}/admin/activity` },
    { icon: Settings, label: 'Settings', labelAr: 'الإعدادات', href: `/${locale}/admin/site-settings` },
  ]

  function handleLogout() {
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Page */}
      <main className="p-6 lg:p-8" style={{ paddingBottom: '100px' }}>
        {children}
      </main>

      {/* Bottom Dock */}
      <BottomDock items={adminItems} onLogout={handleLogout} />
    </div>
  )
}
