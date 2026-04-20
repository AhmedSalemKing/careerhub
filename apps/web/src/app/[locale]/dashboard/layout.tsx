'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { Skeleton } from '../../components/ui/Skeleton'
import BottomDock from '../../../components/BottomDock'
import {
  LayoutDashboard, BookOpen, PlusCircle, Video, Users,
  DollarSign, Settings, ClipboardList, Map, Users2,
  Award, Bell, Calendar, Clock, Star, Sparkles,
} from 'lucide-react'

function getStudentItems(locale: string) {
  return [
    { icon: LayoutDashboard, label: 'Dashboard', labelKey: 'dashboard', href: `/${locale}/dashboard` },
    { icon: ClipboardList, label: 'Assessment', labelKey: 'assessment', href: `/${locale}/dashboard/assessment` },
    { icon: Map, label: 'Career Path', labelKey: 'career_path', href: `/${locale}/dashboard/career-path` },
    { icon: Users2, label: 'Coaching', labelKey: 'coaching', href: `/${locale}/dashboard/coaching` },
    { icon: BookOpen, label: 'Courses', labelKey: 'courses', href: `/${locale}/dashboard/courses` },
    { icon: Award, label: 'Certificates', labelKey: 'certificates', href: `/${locale}/dashboard/certificates` },
    { icon: Bell, label: 'Notifications', labelKey: 'notifications', href: `/${locale}/dashboard/notifications` },
    { icon: Settings, label: 'Settings', labelKey: 'settings', href: `/${locale}/dashboard/settings` },
  ]
}

function getInstructorItems(locale: string) {
  return [
    { icon: LayoutDashboard, label: 'Dashboard', labelKey: 'dashboard', href: `/${locale}/dashboard` },
    { icon: BookOpen, label: 'My Courses', labelKey: 'my_courses', href: `/${locale}/dashboard/my-courses` },
    { icon: PlusCircle, label: 'New Course', labelKey: 'new_course', href: `/${locale}/dashboard/create-course` },
    { icon: Video, label: 'Lectures', labelKey: 'lectures', href: `/${locale}/dashboard/lectures` },
    { icon: Users, label: 'Students', labelKey: 'students', href: `/${locale}/dashboard/students` },
    { icon: DollarSign, label: 'Earnings', labelKey: 'earnings', href: `/${locale}/dashboard/earnings` },
    { icon: Settings, label: 'Settings', labelKey: 'settings', href: `/${locale}/dashboard/settings` },
  ]
}

function getConsultantItems(locale: string) {
  return [
    { icon: LayoutDashboard, label: 'Dashboard', labelKey: 'dashboard', href: `/${locale}/dashboard` },
    { icon: Calendar, label: 'Sessions', labelKey: 'my_sessions', href: `/${locale}/dashboard/my-sessions` },
    { icon: Clock, label: 'Availability', labelKey: 'availability', href: `/${locale}/dashboard/availability` },
    { icon: DollarSign, label: 'Earnings', labelKey: 'earnings', href: `/${locale}/dashboard/earnings` },
    { icon: Star, label: 'Reviews', labelKey: 'reviews', href: `/${locale}/dashboard/reviews` },
    { icon: Settings, label: 'Settings', labelKey: 'settings', href: `/${locale}/dashboard/settings` },
  ]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

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
        <div className="page-content" style={{ paddingTop: '80px' }}>
          {children}
        </div>
      </main>

      {/* Bottom Dock */}
      <BottomDock items={dockItems} onLogout={handleLogout} />
    </div>
  )
}
