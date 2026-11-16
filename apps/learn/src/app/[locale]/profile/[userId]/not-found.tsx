'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function InstructorNotFound() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  return (
    <main
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="color-mix(in srgb, var(--brand) 65%, var(--ink))" strokeWidth="1.2" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
        <path d="M17 3l4 4M21 3l-4 4" strokeLinecap="round" />
      </svg>
      <h1 className="text-3xl font-bold mt-6" style={{ color: 'var(--ink)' }}>{isAr ? 'المحاضر غير موجود' : 'Instructor not found'}</h1>
      <p className="mt-2" style={{ color: 'var(--ink-2)' }}>{isAr ? 'هذا الملف الشخصي غير متاح' : 'This profile is not available'}</p>
      <Link
        href={`/${locale}/courses`}
        className="mt-8 rounded-full px-6 py-3 font-semibold transition-opacity hover:opacity-90"
        style={{ background: 'var(--brand)', color: '#fff' }}
      >
        {isAr ? 'تصفح الكورسات' : 'Browse Courses'}
      </Link>
    </main>
  )
}
