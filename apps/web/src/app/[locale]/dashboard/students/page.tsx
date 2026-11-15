'use client'

import { useLocale } from 'next-intl'

export default function StudentsPage() {
  const isAr = useLocale() === 'ar'
  return (
    <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold font-madinet text-[var(--ink)] mb-2">{isAr ? 'الطلاب' : 'Students'}</h1>
      <p className="text-[color:var(--ink-2)]">{isAr ? 'قريباً...' : 'Coming soon...'}</p>
    </div>
  )
}
