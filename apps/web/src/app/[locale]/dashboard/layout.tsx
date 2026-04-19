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

const studentItems = [
  { icon: LayoutDashboard, label: 'Dashboard', labelAr: 'الرئيسية', href: '/ar/dashboard' },
  { icon: ClipboardList, label: 'Assessment', labelAr: 'اختبار المسار', href: '/ar/dashboard/assessment' },
  { icon: Map, label: 'Career Path', labelAr: 'مساري المهني', href: '/ar/dashboard/career-path' },
  { icon: Users2, label: 'Coaching', labelAr: 'الكوتشينج', href: '/ar/dashboard/coaching' },
  { icon: BookOpen, label: 'Courses', labelAr: 'الكورسات', href: '/ar/dashboard/courses' },
  { icon: Award, label: 'Certificates', labelAr: 'الشهادات', href: '/ar/dashboard/certificates' },
  { icon: Bell, label: 'Notifications', labelAr: 'الإشعارات', href: '/ar/dashboard/notifications' },
  { icon: Settings, label: 'Settings', labelAr: 'الإعدادات', href: '/ar/dashboard/settings' },
]

const instructorItems = [
  { icon: LayoutDashboard, label: 'Dashboard', labelAr: 'الرئيسية', href: '/ar/dashboard' },
  { icon: BookOpen, label: 'My Courses', labelAr: 'كورساتي', href: '/ar/dashboard/my-courses' },
  { icon: PlusCircle, label: 'New Course', labelAr: 'كورس جديد', href: '/ar/dashboard/create-course' },
  { icon: Video, label: 'Lectures', labelAr: 'المحاضرات', href: '/ar/dashboard/lectures' },
  { icon: Users, label: 'Students', labelAr: 'الطلاب', href: '/ar/dashboard/students' },
  { icon: DollarSign, label: 'Earnings', labelAr: 'الإيرادات', href: '/ar/dashboard/earnings' },
  { icon: Settings, label: 'Settings', labelAr: 'الإعدادات', href: '/ar/dashboard/settings' },
]

const consultantItems = [
  { icon: LayoutDashboard, label: 'Dashboard', labelAr: 'الرئيسية', href: '/ar/dashboard' },
  { icon: Calendar, label: 'Sessions', labelAr: 'جلساتي', href: '/ar/dashboard/my-sessions' },
  { icon: Clock, label: 'Availability', labelAr: 'مواعيدي', href: '/ar/dashboard/availability' },
  { icon: DollarSign, label: 'Earnings', labelAr: 'الإيرادات', href: '/ar/dashboard/earnings' },
  { icon: Star, label: 'Reviews', labelAr: 'التقييمات', href: '/ar/dashboard/reviews' },
  { icon: Settings, label: 'Settings', labelAr: 'الإعدادات', href: '/ar/dashboard/settings' },
]

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

  // وضع الشاشة الكاملة للمحادثة الذكية
  const isAiChat = pathname?.includes('ai-chat')

  if (isAiChat) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        {children}
      </div>
    )
  }

  // حالة التحميل
  if (!mounted) {
    return (
      <div className="min-h-screen" dir="rtl" style={{ backgroundColor: 'var(--background)' }}>
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
    ? instructorItems
    : isConsultant
    ? consultantItems
    : studentItems

  function handleLogout() {
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_refresh')
    localStorage.removeItem('deveway_user')
    window.dispatchEvent(new Event('auth:updated'))
    router.replace(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen dashboard-root" dir="rtl">
      {/* محتوى الصفحة */}
      <main className="main-content">
        <div className="page-content" style={{ paddingBottom: '100px' }}>
          {children}
        </div>
      </main>

      {/* Bottom Dock */}
      <BottomDock items={dockItems} onLogout={handleLogout} />
    </div>
  )
}
