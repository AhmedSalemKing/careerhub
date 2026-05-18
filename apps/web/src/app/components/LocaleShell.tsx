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
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    )
  }

  // ✅ صفحات عادية → اظهر Layout كامل
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sticky Navbar */}
      <Navbar />
      
      {/* Main Content - يتوسع ليملأ المساحة المتاحة */}
      <main className="flex-1 relative overflow-x-hidden w-full max-w-[100vw]">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}