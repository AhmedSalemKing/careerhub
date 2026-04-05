'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../../stores/authStore'
import { InstructorSidebar } from '../../components/InstructorSidebar'
import { StudentSidebar } from '../../components/StudentSidebar'
import { ConsultantSidebar } from '../../components/ConsultantSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

  const isAiChat = pathname?.includes('ai-chat')

  // AI chat gets full-screen dark layout — no sidebar
  if (isAiChat) {
    return (
      <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
        {children}
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen" dir="rtl">
        <div className="w-64 shrink-0" style={{ background: '#141414', borderLeft: '1px solid rgba(255,255,255,0.08)' }} />
        <main className="flex-1 p-6" style={{ background: '#0D0D0D' }}>
          <div className="h-8 w-48 animate-pulse rounded-lg" style={{ background: '#1F1F1F' }} />
          <div className="h-4 w-72 animate-pulse rounded mt-2" style={{ background: '#1F1F1F' }} />
        </main>
      </div>
    )
  }

  const isInstructor = user?.accountType === 'INSTRUCTOR'
  const isConsultant = user?.accountType === 'CONSULTANT'

  // الخلفية الأساسية اللامعة مطبقة هنا
  return (
    <div className="flex min-h-screen" dir="rtl" style={{ background: '#0D0D0D' }}>
      {/* Sidebars have their own styling, we just render them */}
      {isInstructor ? <InstructorSidebar /> : isConsultant ? <ConsultantSidebar /> : <StudentSidebar />}
      
      <main 
        className="flex-1 overflow-auto relative"
        style={{ 
          background: '#0D0D0D',
          // إضافة تأثير اللمعان (Glossy Glow) على الخلفية
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02), transparent 60%)
          `,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        {children}
      </main>
    </div>
  )
}