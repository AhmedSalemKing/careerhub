'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '../../../stores/authStore'
import { InstructorSidebar } from '../../components/InstructorSidebar'
import { StudentSidebar } from '../../components/StudentSidebar'
import { ConsultantSidebar } from '../../components/ConsultantSidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
        <div className="hidden lg:block w-64 shrink-0" style={{ background: '#141414', borderLeft: '1px solid rgba(255,255,255,0.08)' }} />
        <main className="flex-1 p-6" style={{ background: '#0D0D0D' }}>
          <div className="h-8 w-48 animate-pulse rounded-lg" style={{ background: '#1F1F1F' }} />
          <div className="h-4 w-72 animate-pulse rounded mt-2" style={{ background: '#1F1F1F' }} />
        </main>
      </div>
    )
  }

  const isInstructor = user?.accountType === 'INSTRUCTOR'
  const isConsultant = user?.accountType === 'CONSULTANT'

  return (
    <div className="flex min-h-screen" dir="rtl" style={{ background: '#0D0D0D' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile (drawer), sticky on desktop */}
      <div
        className={[
          'fixed lg:sticky top-0 right-0 h-screen z-50 lg:z-auto',
          'transition-transform duration-300 ease-in-out shrink-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {isInstructor ? <InstructorSidebar /> : isConsultant ? <ConsultantSidebar /> : <StudentSidebar />}
      </div>

      {/* Main content */}
      <main
        className="flex-1 overflow-auto relative min-w-0"
        style={{
          background: '#0D0D0D',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.02), transparent 60%)
          `,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* Mobile top bar */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between"
          style={{
            padding: '10px 16px',
            background: 'rgba(13,13,13,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
              fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              minHeight: 'auto',
            }}
          >
            <Menu size={18} />
            القائمة
          </button>
          <img src="/logo-icon.png" style={{ height: 28, width: 'auto' }} alt="DeveWay" />
        </div>

        {/* Page content */}
        <div style={{ padding: 'clamp(16px, 3vw, 32px)' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
