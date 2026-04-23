'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { Skeleton } from '../../components/ui/Skeleton'
import BottomDock from '../../../components/BottomDock'
import {
  LayoutDashboard, BookOpen, Brain, MessageSquare, Users,
  Award, Settings, PlusCircle, BarChart2, DollarSign,
  Calendar, Clock, Star,
} from 'lucide-react'

function getStudentItems(locale: string) {
  return [
    { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Dashboard', href: `/${locale}/dashboard` },
    { icon: BookOpen, labelAr: 'كورساتي', labelEn: 'Courses', href: `/${locale}/dashboard/my-courses` },
    { icon: Brain, labelAr: 'التقييم', labelEn: 'Assessment', href: `/${locale}/dashboard/assessment` },
    { icon: MessageSquare, labelAr: 'المحادثة', labelEn: 'AI Chat', href: `/${locale}/dashboard/ai-chat` },
    { icon: Users, labelAr: 'الكوتشنج', labelEn: 'Coaching', href: `/${locale}/dashboard/my-sessions` },
    { icon: Award, labelAr: 'الشهادات', labelEn: 'Certificates', href: `/${locale}/dashboard/certificates` },
    { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
  ]
}

function getInstructorItems(locale: string) {
  return [
    { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Dashboard', href: `/${locale}/dashboard` },
    { icon: BookOpen, labelAr: 'كورساتي', labelEn: 'My Courses', href: `/${locale}/dashboard/my-courses` },
    { icon: PlusCircle, labelAr: 'كورس جديد', labelEn: 'New Course', href: `/${locale}/dashboard/create-course` },
    { icon: BarChart2, labelAr: 'التحليلات', labelEn: 'Analytics', href: `/${locale}/dashboard/analytics` },
    { icon: DollarSign, labelAr: 'الإيرادات', labelEn: 'Revenue', href: `/${locale}/dashboard/revenue` },
    { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
  ]
}

function getConsultantItems(locale: string) {
  return [
    { icon: LayoutDashboard, labelAr: 'الرئيسية', labelEn: 'Dashboard', href: `/${locale}/dashboard` },
    { icon: Calendar, labelAr: 'جلساتي', labelEn: 'My Sessions', href: `/${locale}/dashboard/my-sessions` },
    { icon: Clock, labelAr: 'الجدول', labelEn: 'Schedule', href: `/${locale}/dashboard/schedule` },
    { icon: DollarSign, labelAr: 'الإيرادات', labelEn: 'Revenue', href: `/${locale}/dashboard/revenue` },
    { icon: Star, labelAr: 'التقييمات', labelEn: 'Reviews', href: `/${locale}/dashboard/reviews` },
    { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', href: `/${locale}/dashboard/settings` },
  ]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

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

  const isInstructor = user?.accountType === 'INSTRUCTOR'
  const isConsultant = user?.accountType === 'CONSULTANT'

  const dockItems = isInstructor
    ? getInstructorItems(locale)
    : isConsultant
    ? getConsultantItems(locale)
    : getStudentItems(locale)

  function handleLogout() {
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen dashboard-root" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
