'use client'

import { usePathname } from 'next/navigation'
// 🎯 تأكد من المسار الصح حسب مكان الملف
import { Navbar } from './Navbar'  // ← غيّر المسار لو لزم
import { Footer } from './Footer'

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // ✅ تحسين: التحقق الأفضل لمسار admin
  const isAdmin = pathname?.startsWith('/admin') || pathname?.includes('/admin')

  // 🚫 لو صفحة admin → لا تظهر Navbar/Footer
  if (isAdmin) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // ✅ صفحات عادية → اظهر Layout كامل
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      {/* Sticky Navbar */}
      <Navbar />
      
      {/* Main Content - يتوسع ليملأ المساحة المتاحة */}
      <main className="flex-1 relative">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}