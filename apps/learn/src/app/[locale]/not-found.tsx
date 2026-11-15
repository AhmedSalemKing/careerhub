'use client'

import { useLocale } from 'next-intl'

export default function NotFound() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  return (
    <main dir={isAr ? 'rtl' : 'ltr'} style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1>{isAr ? '404 — الصفحة غير موجودة' : '404 — Page not found'}</h1>
      <p>{isAr ? 'الكورس الذي تبحث عنه غير موجود أو تم حذفه.' : 'The course you are looking for does not exist or has been removed.'}</p>
      <a href={`/${locale}/courses`} style={{ textDecoration: 'underline' }}>{isAr ? 'العودة لقائمة الكورسات' : 'Back to the courses list'}</a>
    </main>
  )
}
