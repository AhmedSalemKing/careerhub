'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * HashScrollHandler
 * 
 * بيعالج السكرول لـ hash anchors (#career-paths) لما الصفحة تحمل
 * بيشتغل مع Next.js App Router لأنه Server Component
 */
export function HashScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // جيب الـ hash من URL
    const hash = window.location.hash
    
    if (hash) {
      // شيل الـ # من الأول
      const id = hash.replace('#', '')
      
      // انتظر شوية لحد كل العناصر تحمل في DOM
      const attemptScroll = (attempts = 0) => {
        const target = document.getElementById(id)
        
        if (target) {
          // لقينا العنصر → اسكرول
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        } else if (attempts < 10) {
          // لسه محتاج ننتظر → حاول تاني بعد 200ms
          setTimeout(() => attemptScroll(attempts + 1), 200)
        }
      }
      
      // ابدأ المحاولة بعد شوية (لحد الـ page يكمل load)
      setTimeout(() => attemptScroll(), 300)
    }
  }, [pathname]) // يعيد تشغيل لما يتغير pathname

  // المكون ده مش بيرجع أي HTML - invisible
  return null
}