'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../../stores/authStore'
import { InstructorSidebar } from '../../components/InstructorSidebar'
import { StudentSidebar } from '../../components/StudentSidebar'
import { ConsultantSidebar } from '../../components/ConsultantSidebar'
import { Menu, X } from 'lucide-react'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

  // إغلاق Sidebar عند تغيير المسار
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
      <div className="flex min-h-screen" dir="rtl">
        {/* هيكل Sidebar */}
        <div 
          className="hidden lg:block w-[280px] shrink-0 border-l border-[var(--navbar-border)]"
          style={{ background: 'var(--surface)' }}
        >
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-40 rounded-xl" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <main 
          className="flex-1 p-6 lg:p-8"
          style={{ backgroundColor: 'var(--background)' }}
        >
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

  return (
    <div className="flex min-h-screen dashboard-root" dir="rtl">
      
      {/* خلفية شفافة للجوال عند فتح القائمة */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        className={`
          fixed lg:sticky top-0 right-0 h-screen z-50 lg:z-auto sidebar-container overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-out
        `}
      >
        {isInstructor && <InstructorSidebar />}
        {isConsultant && <ConsultantSidebar />}
        {!isInstructor && !isConsultant && <StudentSidebar />}
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        
        {/* شريط العلوي للجوال */}
        <header className="mobile-header">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="mobile-menu-btn"
            type="button"
            aria-label="فتح القائمة الجانبية"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            <span>القائمة</span>
          </button>
          
          <div className="flex items-center gap-3">
            <img 
              src="/logo-icon.png" 
              alt="شعار DeveWay" 
              className="h-8 w-auto"
            />
            <span 
              className="font-bold text-[var(--foreground)] text-lg hidden sm:inline-block"
              style={{ fontFamily: "'PingARLT', sans-serif" }}
            >
              DeveWay
            </span>
          </div>
        </header>

        {/* محتوى الصفحة */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}